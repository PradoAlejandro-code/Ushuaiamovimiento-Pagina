import csv
import zipfile
import io
from django.http import HttpResponse
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Count
from django.db.models.functions import TruncDate, TruncMonth, TruncYear
from .models import Encuesta, Pregunta, RespuestaHeader, RespuestaDetalle, Seccion, Barrio, RespuestaFoto, Grupo

User = get_user_model()
from .serializers import ( EncuestaCreateSerializer, EncuestaDetailSerializer, RespuestaCreateSerializer, SeccionSerializer, PreguntaSerializer, 
RecentResponseSerializer, RespuestaFullSerializer, RespuestaUpdateSerializer, RespuestaListSerializer, GrupoSerializer)

class PreguntaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Pregunta.objects.all()
    serializer_class = PreguntaSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        instance.activa = False
        instance.save()

class PreguntaCreateView(generics.CreateAPIView):
    queryset = Pregunta.objects.all()
    serializer_class = PreguntaSerializer
    permission_classes = [IsAuthenticated]

class GrupoCreateView(generics.CreateAPIView):
    queryset = Grupo.objects.all()
    serializer_class = GrupoSerializer
    permission_classes = [IsAuthenticated]

class GrupoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Grupo.objects.all()
    serializer_class = GrupoSerializer
    permission_classes = [IsAuthenticated]

class SeccionListView(generics.ListAPIView):
    queryset = Seccion.objects.all()
    serializer_class = SeccionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

class EncuestaCreateView(generics.CreateAPIView):
    queryset = Encuesta.objects.all()
    serializer_class = EncuestaCreateSerializer
    permission_classes = [IsAuthenticated]

class EncuestaActiveListView(generics.ListAPIView):
    serializer_class = EncuestaDetailSerializer 
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Encuesta.objects.filter(activo=True).order_by('-id')



class EncuestaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Encuesta.objects.all()
    serializer_class = EncuestaDetailSerializer
    permission_classes = [IsAuthenticated]

class RelevamientoDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        relevamiento = Encuesta.objects.filter(es_relevamiento=True).first()
        if not relevamiento:
            return Response({"error": "No se encontró un relevamiento activo."}, status=status.HTTP_404_NOT_FOUND)
        serializer = EncuestaDetailSerializer(relevamiento)
        return Response(serializer.data)

class RespuestaCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        import json
        
        try:
            encuesta = get_object_or_404(Encuesta, pk=pk)
            
            content_type = request.content_type or ""
            is_multipart = 'multipart/form-data' in content_type
            
            if is_multipart:
                raw_json = request.data.get('data') or request.POST.get('data')
                
                if not raw_json:
                    return Response({
                        "error": "Falta el campo 'data' en la petición multipart."
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                try:
                    parsed_data = json.loads(raw_json)
                except Exception as je:
                    return Response({"error": f"JSON inválido en el campo 'data': {str(je)}"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                parsed_data = request.data

            serializer = RespuestaCreateSerializer(data=parsed_data)
            
            if serializer.is_valid():
                data = serializer.validated_data
                
                header = RespuestaHeader.objects.create(
                    encuesta=encuesta,
                    usuario=request.user,
                    seccion=data.get('seccion'),
                    barrio=data.get('barrio')
                )

                respuestas_list = data.get('respuestas', [])
                for rta in respuestas_list:
                    pregunta_id = rta.get('pregunta_id')
                    valor = rta.get('valor')
                    
                    try:
                        pregunta = Pregunta.objects.get(id=pregunta_id, encuesta=encuesta)
                    except Pregunta.DoesNotExist:
                        continue 
                    
                    valor_texto = str(valor) if valor is not None else ""
                    valor_numero = None
                    if pregunta.tipo == 'numero' and valor:
                        try:
                            valor_numero = float(valor)
                        except ValueError:
                            pass
                    
                    detalle = RespuestaDetalle.objects.create(
                        header=header,
                        pregunta=pregunta,
                        valor_texto=valor_texto,
                        valor_numero=valor_numero
                    )
                    
                    if is_multipart:
                         file_key = f"foto_{pregunta_id}"
                         if file_key in request.FILES:
                            files = request.FILES.getlist(file_key)
                            for f in files:
                                if f.size > 0:
                                    try:
                                        RespuestaFoto.objects.create(detalle=detalle, imagen=f)
                                        # Actualizamos el valor_texto del detalle para que el frontend sepa que hay contenido
                                        if not detalle.valor_texto:
                                            detalle.valor_texto = f"[Foto: {f.name}]"
                                            detalle.save()
                                    except Exception:
                                        pass

                fecha_custom = data.get('fecha_custom')
                if fecha_custom:
                    header.fecha_envio = fecha_custom
                    header.save()

                return Response({"message": "Respuesta guardada correctamente"}, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                "error": "Error interno al guardar la respuesta.",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RespuestaManualCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        import json
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            encuesta = get_object_or_404(Encuesta, pk=pk)
            
            content_type = request.content_type or ""
            is_multipart = 'multipart/form-data' in content_type
            
            if is_multipart:
                raw_json = request.data.get('data') or request.POST.get('data')
                
                if not raw_json:
                    return Response({
                        "error": "Falta el campo 'data' en la petición multipart."
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                try:
                    parsed_data = json.loads(raw_json)
                except Exception as je:
                    return Response({"error": f"JSON inválido en el campo 'data': {str(je)}"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                parsed_data = request.data

            # Extra details for manual injection
            usuario_id = parsed_data.get('usuario_id')
            fecha_manual = parsed_data.get('fecha_manual')
            
            if not usuario_id:
                return Response({"error": "Falta el campo 'usuario_id'."}, status=status.HTTP_400_BAD_REQUEST)
                
            try:
                target_user = User.objects.get(id=usuario_id)
            except User.DoesNotExist:
                return Response({"error": "El usuario especificado no existe."}, status=status.HTTP_400_BAD_REQUEST)

            serializer = RespuestaCreateSerializer(data=parsed_data)
            
            if serializer.is_valid():
                data = serializer.validated_data
                
                header = RespuestaHeader.objects.create(
                    encuesta=encuesta,
                    usuario=target_user,
                    seccion=data.get('seccion'),
                    barrio=data.get('barrio')
                )

                respuestas_list = data.get('respuestas', [])
                for rta in respuestas_list:
                    pregunta_id = rta.get('pregunta_id')
                    valor = rta.get('valor')
                    
                    try:
                        pregunta = Pregunta.objects.get(id=pregunta_id, encuesta=encuesta)
                    except Pregunta.DoesNotExist:
                        continue 
                    
                    valor_texto = str(valor) if valor is not None else ""
                    valor_numero = None
                    if pregunta.tipo == 'numero' and valor:
                        try:
                            valor_numero = float(valor)
                        except ValueError:
                            pass
                    
                    detalle = RespuestaDetalle.objects.create(
                        header=header,
                        pregunta=pregunta,
                        valor_texto=valor_texto,
                        valor_numero=valor_numero
                    )
                    
                    if is_multipart:
                         file_key = f"foto_{pregunta_id}"
                         if file_key in request.FILES:
                            files = request.FILES.getlist(file_key)
                            for f in files:
                                if f.size > 0:
                                    try:
                                        RespuestaFoto.objects.create(detalle=detalle, imagen=f)
                                        # Actualizamos el valor_texto del detalle para que el frontend sepa que hay contenido
                                        if not detalle.valor_texto:
                                            detalle.valor_texto = f"[Foto: {f.name}]"
                                            detalle.save()
                                    except Exception:
                                        pass

                # Set custom date
                if fecha_manual:
                    header.fecha_envio = fecha_manual
                    header.save()

                return Response({"message": "Respuesta manual guardada correctamente"}, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                "error": "Error interno al guardar la respuesta manual.",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class RecentResponseListView(generics.ListAPIView):
    serializer_class = RecentResponseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RespuestaHeader.objects.all().order_by('-fecha_envio', '-id')[:20]

class EncuestaManagementListView(generics.ListAPIView):
    serializer_class = EncuestaDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Encuesta.objects.filter(es_relevamiento=False).annotate(conteo_respuestas=Count('respuestas')).order_by('-fecha_creacion', '-id')





class SurveyResponseListView(generics.ListAPIView):
    serializer_class = RespuestaListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        encuesta_id = self.kwargs['encuesta_id']
        queryset = RespuestaHeader.objects.filter(encuesta_id=encuesta_id)\
            .select_related('usuario', 'contacto')

        # Filtros
        # Soportamos tanto 'seccion' como 'seccion[]' por cómo Axios serializa los arrays
        secciones = self.request.query_params.getlist('seccion') or self.request.query_params.getlist('seccion[]')
        barrios = self.request.query_params.getlist('barrio') or self.request.query_params.getlist('barrio[]')
        
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        usuario_id = self.request.query_params.get('usuario')
        search_id = self.request.query_params.get('id')

        if secciones:
            queryset = queryset.filter(seccion__in=secciones)
        if barrios:
            queryset = queryset.filter(barrio__in=barrios)
        if fecha_desde:
             # Asumiendo formato YYYY-MM-DD
            queryset = queryset.filter(fecha_envio__date__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_envio__date__lte=fecha_hasta)
        if usuario_id:
            queryset = queryset.filter(usuario_id=usuario_id)
        if search_id:
            queryset = queryset.filter(id=search_id)

        if self.request.query_params.get('ordering'):
            queryset = queryset.order_by(self.request.query_params.get('ordering'))
        else:
            queryset = queryset.order_by('-fecha_envio', '-id')

        return queryset

class MyResponsesListView(generics.ListAPIView):
    serializer_class = RespuestaListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RespuestaHeader.objects.filter(usuario=self.request.user).order_by('-id')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class SurveyRespondentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        respondents = User.objects.filter(
            encuestas_respondidas__encuesta_id=pk
        ).distinct().values('id', 'username', 'first_name', 'last_name')
        
        return Response(list(respondents))

class RespuestaUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = RespuestaHeader.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return RespuestaFullSerializer
        return RespuestaUpdateSerializer

    def update(self, request, *args, **kwargs):
        import json
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        content_type = request.content_type or ""
        if 'multipart/form-data' in content_type:
             raw_json = request.data.get('data') or request.POST.get('data')
             if raw_json:
                 try:
                     parsed_data = json.loads(raw_json)
                     serializer = self.get_serializer(instance, data=parsed_data, partial=partial)
                     
                     if serializer.is_valid():
                         self.perform_update(serializer)
                         
                         if getattr(instance, '_prefetched_objects_cache', None):
                             instance._prefetched_objects_cache = {}
                             
                         return Response(serializer.data)
                     else:
                        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

                 except Exception as e:
                     return Response({"error": f"JSON inválido en 'data': {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        header = serializer.save()
        content_type = self.request.content_type or ""
        if 'multipart/form-data' in content_type:
            for key, files in self.request.FILES.lists():
                if key.startswith('foto_'):
                    try:
                        pregunta_id = int(key.split('_')[1])
                    except (IndexError, ValueError):
                        continue
                    
                    if not files: continue
                    
                    detalle, created = RespuestaDetalle.objects.get_or_create(
                        header=header,
                        pregunta_id=pregunta_id,
                        defaults={
                            'valor_texto': "",
                            'valor_numero': None
                        }
                    )

                    for f in files:
                         if f.size > 0:
                            try:
                                RespuestaFoto.objects.create(detalle=detalle, imagen=f)
                            except Exception as img_err:
                                print(f"Error saving image (update): {img_err}")

        data = serializer.initial_data
        
        def parse_ids(key):
            val = data.get(key)
            if not val: return []
            if isinstance(val, list): return val
            if isinstance(val, str):
                try:
                    import json
                    parsed = json.loads(val)
                    if isinstance(parsed, list): return parsed
                except:
                    return [x.strip() for x in val.split(',') if x.strip()]
            return []

        delete_extras = parse_ids('delete_extra_ids')
        if delete_extras:
            RespuestaFoto.objects.filter(
                id__in=delete_extras, 
                detalle__header=header
            ).delete()

