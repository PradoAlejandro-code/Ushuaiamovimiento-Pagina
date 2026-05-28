from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from django.db.models.functions import TruncDate, TruncMonth, TruncYear
from surveys.models import Encuesta, RespuestaHeader, RespuestaDetalle
from enrollments.models import Person

User = get_user_model()

class SurveyMetricsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        encuesta = get_object_or_404(Encuesta, pk=pk)
        secciones = request.query_params.getlist('seccion') or request.query_params.getlist('seccion[]')
        barrios = request.query_params.getlist('barrio') or request.query_params.getlist('barrio[]')
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')

        qs_base = RespuestaHeader.objects.filter(encuesta=encuesta)

        if secciones:
            qs_base = qs_base.filter(seccion__in=secciones)
        if barrios:
            qs_base = qs_base.filter(barrio__in=barrios)
        if fecha_desde:
            qs_base = qs_base.filter(fecha_envio__date__gte=fecha_desde)
        if fecha_hasta:
            qs_base = qs_base.filter(fecha_envio__date__lte=fecha_hasta)

        participacion = (
            qs_base
            .exclude(usuario__username__in=['admin', 'Otros', 'otros', 'Admin'])
            .values('usuario')
            .annotate(value=Count('id'))
            .order_by('-value')
        )

        ranking_data = []
        for p in participacion:
            try:
                user = User.objects.get(pk=p['usuario'])
                picture_url = None
                if user.profile_picture:
                    picture_url = request.build_absolute_uri(user.profile_picture.url)
                    if picture_url.startswith('http://api.ushuaiamovimiento.com.ar'):
                        picture_url = picture_url.replace('http://', 'https://')
                
                ranking_data.append({
                    "name": f"{user.first_name} {user.last_name}".strip() or user.username,
                    "value": p['value'],
                    "image": picture_url,  
                    "usuario_foto": picture_url
                })
            except User.DoesNotExist:
                continue

        preguntas_stats = []
        preguntas_cuantificables = encuesta.preguntas.filter(
            tipo__in=['opciones', 'booleano'], 
            activa=True
        ).order_by('orden')

        for pregunta in preguntas_cuantificables:
            distribucion = (
                RespuestaDetalle.objects.filter(pregunta=pregunta, header__in=qs_base)
                .values('valor_texto')
                .annotate(value=Count('id'))
                .order_by('-value')
            )

            if distribucion.exists():
                preguntas_stats.append({
                    "id": f"q_{pregunta.id}",
                    "title": pregunta.titulo,
                    "type": "pie" if pregunta.tipo == 'opciones' else "bar",
                    "data": [
                        {"name": d['valor_texto'] or "Sin respuesta", "value": d['value']}
                        for d in distribucion
                    ]
                })

        final_stats = [
            {
                "id": "participation",
                "title": "Participación por Usuario",
                "type": "bar",
                "data": ranking_data
            }
        ] + preguntas_stats

        return Response(final_stats)

class GlobalStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from enrollments.serializers import PersonSerializer
        period = request.query_params.get('period', 'day')
        group_by = request.query_params.get('group_by', 'date')
        
        ahora = timezone.localtime(timezone.now())
        hoy_inicio = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
        ayer_inicio = hoy_inicio - timedelta(days=1)
        
        qs_base = RespuestaHeader.objects.all()

        total_respuestas = qs_base.count()
        count_hoy = qs_base.filter(fecha_envio__gte=hoy_inicio).count()
        count_ayer = qs_base.filter(fecha_envio__gte=ayer_inicio, fecha_envio__lt=hoy_inicio).count()
        
        trend_hoy = 0
        if count_ayer > 0:
            trend_hoy = round(((count_hoy - count_ayer) / count_ayer) * 100)
        elif count_hoy > 0:
            trend_hoy = 100

        inicio_mes_actual = ahora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if inicio_mes_actual.month == 1:
            inicio_mes_anterior = inicio_mes_actual.replace(year=inicio_mes_actual.year - 1, month=12)
        else:
            inicio_mes_anterior = inicio_mes_actual.replace(month=inicio_mes_actual.month - 1)
        
        relev_qs = qs_base.filter(encuesta__es_relevamiento=True)
        count_relev_actual = relev_qs.filter(fecha_envio__gte=inicio_mes_actual).count()
        count_relev_anterior = relev_qs.filter(fecha_envio__gte=inicio_mes_anterior, fecha_envio__lt=inicio_mes_actual).count()
        
        trend_relev = 0
        if count_relev_anterior > 0:
            trend_relev = round(((count_relev_actual - count_relev_anterior) / count_relev_anterior) * 100)
        elif count_relev_actual > 0:
            trend_relev = 100

        # --- LÓGICA DE FILTRADO PARA EL GRÁFICO (RECHART DATA) ---
        start_date = None
        if period == 'day':
            start_date = hoy_inicio
        elif period == 'month':
            start_date = inicio_mes_actual
        elif period == 'year':
            start_date = ahora.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        chart_qs = qs_base
        if start_date:
            chart_qs = chart_qs.filter(fecha_envio__gte=start_date)

        data = []
        if group_by == 'user':
            stats = chart_qs.exclude(usuario__username__in=['admin', 'Otros', 'otros', 'Admin']).values('usuario').annotate(count=Count('id')).order_by('-count')
            
            for item in stats:
                uid = item['usuario']
                try:
                    user = User.objects.get(id=uid)
                    name = f"{user.first_name} {user.last_name}".strip() if user.first_name or user.last_name else (user.username or "Anónimo")
                    
                    picture_url = None
                    if user.profile_picture:
                        picture_url = request.build_absolute_uri(user.profile_picture.url)
                        if picture_url.startswith('http://api.ushuaiamovimiento.com.ar'):
                            picture_url = picture_url.replace('http://', 'https://')

                    data.append({
                        "name": name,
                        "value": item['count'],
                        "image": picture_url
                    })
                except User.DoesNotExist:
                    continue
        else:
            if period == 'year':
                trunc_func = TruncYear('fecha_envio')
            elif period == 'month':
                trunc_func = TruncMonth('fecha_envio')
            else:
                trunc_func = TruncDate('fecha_envio')

            stats = chart_qs.annotate(date=trunc_func).values('date').annotate(count=Count('id')).order_by('date')
            
            data = [
                {
                    "name": item['date'].strftime('%Y-%m-%d') if period == 'day' else (item['date'].strftime('%Y-%m') if period == 'month' else item['date'].strftime('%Y')),
                    "value": item['count']
                }
                for item in stats
            ]
        
        from enrollments.models import AsignacionCumpleanos
        cumples_entregados = AsignacionCumpleanos.objects.filter(
            persona__birth_date__month=ahora.month,
            persona__birth_date__day=ahora.day,
            anio=ahora.year,
            entregado=True
        ).count()

        return Response({
            "summary": {
                "total_respuestas": total_respuestas,
                "movimientos_hoy": count_hoy,
                "trend_hoy": trend_hoy,
                "total_relevamientos": count_relev_actual,
                "trend_relev": trend_relev,
                "cumples_entregados": cumples_entregados
            },
            "birthdays": {
                "today": PersonSerializer(
                    Person.objects.filter(birth_date__month=ahora.month, birth_date__day=ahora.day),
                    many=True,
                    context={'request': request}
                ).data,
                "after_tomorrow": PersonSerializer(
                    Person.objects.filter(
                        birth_date__month=(ahora + timedelta(days=2)).month, 
                        birth_date__day=(ahora + timedelta(days=2)).day
                    ),
                    many=True,
                    context={'request': request}
                ).data
            },
            "chart_data": data 
        })