from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from django.db.models.functions import TruncDate, TruncMonth, TruncYear
from surveys.models import RespuestaHeader

User = get_user_model()

class GlobalStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', 'day')
        group_by = request.query_params.get('group_by', 'date')
        
        ahora = timezone.now()
        hoy_inicio = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
        ayer_inicio = hoy_inicio - timedelta(days=1)
        
        qs_base = RespuestaHeader.objects.all()

        # --- MÉTRICAS DEL SUMMARY (SE MANTIENEN IGUAL) ---
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
        # Definimos el punto de inicio según el periodo seleccionado para que las barras cambien
        start_date = None
        if period == 'day':
            start_date = hoy_inicio
        elif period == 'month':
            start_date = inicio_mes_actual
        elif period == 'year':
            start_date = ahora.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

        # Filtramos el queryset del gráfico si hay un periodo definido
        chart_qs = qs_base
        if start_date:
            chart_qs = chart_qs.filter(fecha_envio__gte=start_date)

        data = []
        if group_by == 'user':
            # Usamos chart_qs (ya filtrado) en lugar de qs_base
            stats = chart_qs.values('usuario').annotate(count=Count('id')).order_by('-count')
            
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
            # Para gráficos de tendencia, usamos el truncado temporal
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
        
        return Response({
            "summary": {
                "total_respuestas": total_respuestas,
                "movimientos_hoy": count_hoy,
                "trend_hoy": trend_hoy,
                "total_relevamientos": count_relev_actual,
                "trend_relev": trend_relev
            },
            "chart_data": data 
        })