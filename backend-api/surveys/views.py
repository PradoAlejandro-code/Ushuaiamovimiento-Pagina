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
from .models import Encuesta, Pregunta, RespuestaHeader, RespuestaDetalle, Seccion, Barrio, RespuestaFoto

User = get_user_model()
from .serializers import ( EncuestaCreateSerializer, EncuestaDetailSerializer, RespuestaCreateSerializer, SeccionSerializer, PreguntaSerializer, 
RecentResponseSerializer, RespuestaFullSerializer, RespuestaUpdateSerializer)

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

class SeccionListView(generics.ListAPIView):
    queryset = Seccion.objects.all()
    serializer_class = SeccionSerializer
    permission_classes = [IsAuthenticated]

class EncuestaCreateView(generics.CreateAPIView):
    queryset = Encuesta.objects.all()
    serializer_class = EncuestaCreateSerializer
    permission_classes = [IsAuthenticated]

class EncuestaActiveListView(generics.ListAPIView):
    serializer_class = EncuestaDetailSerializer 
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Encuesta.objects.filter(activo=True)



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
        import traceback
        
        try:
            encuesta = get_object_or_404(Encuesta, pk=pk)
            
            content_type = request.content_type or ""
            is_multipart = 'multipart/form-data' in content_type
            
            if is_multipart:
                raw_json = request.data.get('data') or request.POST.get('data')
                
                if not raw_json:
                    return Response({
                        "error": "Falta el campo 'data' en la petición multipart.",
                        "debug_info": {
                            "post_keys": list(request.POST.keys()),
                            "data_keys": list(request.data.keys()) if hasattr(request.data, 'keys') else "no-dict"
                        }
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
                    
                    valor_foto = None
                                
                    detalle = RespuestaDetalle.objects.create(
                        header=header,
                        pregunta=pregunta,
                        valor_texto=valor_texto,
                        valor_numero=valor_numero,
                        valor_foto=valor_foto
                    )
                    
                    if is_multipart:
                         file_key = f"foto_{pregunta_id}"
                         if file_key in request.FILES:
                            files = request.FILES.getlist(file_key)
                            for f in files:
                                if f.size > 0:
                                    try:
                                        RespuestaFoto.objects.create(detalle=detalle, imagen=f)
                                    except Exception as img_err:
                                        print(f"Error saving image: {img_err}")

                fecha_custom = data.get('fecha_custom')
                if fecha_custom:
                    header.fecha_envio = fecha_custom
                    header.save()

                return Response({"message": "Respuesta guardada correctamente"}, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            tb = traceback.format_exc()
            print(tb) 
            return Response({
                "error": "Error interno al guardar la respuesta.",
                "details": str(e),
                "traceback": tb 
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class RecentResponseListView(generics.ListAPIView):
    serializer_class = RecentResponseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RespuestaHeader.objects.select_related('usuario', 'encuesta').order_by('-fecha_envio')[:5]

class EncuestaManagementListView(generics.ListAPIView):
    serializer_class = EncuestaDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Encuesta.objects.filter(es_relevamiento=False).annotate(conteo_respuestas=Count('respuestas')).order_by('-fecha_creacion')





class SurveyResponseListView(generics.ListAPIView):
    serializer_class = RespuestaFullSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        encuesta_id = self.kwargs['encuesta_id']
        return RespuestaHeader.objects.filter(encuesta_id=encuesta_id).prefetch_related('detalles').order_by('-fecha_envio')

class ExportarEncuestaCompletaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        encuesta = get_object_or_404(Encuesta, pk=pk)
        
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            preguntas = encuesta.preguntas.filter(activa=True).order_by('orden')
            headers_static = ['ID Respuesta', 'Fecha', 'Usuario', 'Barrio', 'Seccion']
            headers_dinamicos = [f"P{p.orden}: {p.titulo}" for p in preguntas]
            
            csv_buffer = io.StringIO()
            writer = csv.writer(csv_buffer)
            writer.writerow(headers_static + headers_dinamicos)

            respuestas = RespuestaHeader.objects.filter(encuesta=encuesta).select_related('usuario').prefetch_related('detalles__pregunta', 'detalles__fotos_extra')

            for rta in respuestas:
                row = [
                    rta.id,
                    rta.fecha_envio.strftime('%Y-%m-%d %H:%M'),
                    rta.usuario.username if rta.usuario else 'Anónimo',
                    rta.barrio or '-',
                    rta.seccion or '-'
                ]

                detalles_map = {d.pregunta_id: d for d in rta.detalles.all()}
                
                for p in preguntas:
                    val = ""
                    detalle = detalles_map.get(p.id)
                    if detalle:
                        fotos = list(detalle.fotos_extra.all())
                        
                        if fotos:
                            nombres_fotos = []
                            for idx, f in enumerate(fotos):
                                if f.imagen and f.imagen.name:
                                    try:
                                        ext = f.imagen.name.split('.')[-1]
                                        zip_filename = f"imagenes/R{rta.id}_P{p.orden}_{p.id}_{idx+1}.{ext}"
                                        
                                        with open(f.imagen.path, 'rb') as img_f:
                                            zip_file.writestr(zip_filename, img_f.read())
                                        
                                        nombres_fotos.append(zip_filename)
                                    except Exception as e:
                                        nombres_fotos.append(f"ERR_IMG_{idx}: {e}")
                            
                            val = " | ".join(nombres_fotos)
                            
                        elif detalle.valor_foto:
                            if detalle.valor_foto.name: 
                                try:
                                    ext = detalle.valor_foto.name.split('.')[-1]
                                    zip_filename = f"imagenes/R{rta.id}_P{p.orden}_{p.id}.{ext}"
                                    
                                    with open(detalle.valor_foto.path, 'rb') as img_f:
                                        zip_file.writestr(zip_filename, img_f.read())
                                    
                                    val = zip_filename
                                except Exception as e:
                                    val = f"ERROR_IMG: {str(e)}"
                        else:
                            val = detalle.valor_texto or str(detalle.valor_numero) if detalle.valor_numero is not None else ""
                    
                    row.append(val)
                
                writer.writerow(row)

            zip_file.writestr('respuestas.csv', csv_buffer.getvalue())

        zip_buffer.seek(0)
        response = HttpResponse(zip_buffer, content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="Reporte_Completo_{encuesta.id}.zip"'
        return response


class RespuestaUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = RespuestaHeader.objects.all()
    serializer_class = RespuestaUpdateSerializer
    permission_classes = [IsAuthenticated]

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

        delete_legacy = parse_ids('delete_legacy_detail_ids')
        if delete_legacy:
            RespuestaDetalle.objects.filter(
                id__in=delete_legacy,
                header=header
            ).update(valor_foto=None)


