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
from .models import Encuesta, Pregunta, RespuestaHeader, RespuestaDetalle, Seccion, Barrio, RespuestaFoto, Contacto

User = get_user_model()
from .serializers import (
    EncuestaCreateSerializer, 
    EncuestaDetailSerializer, 
    RespuestaCreateSerializer,
    SeccionSerializer,
    PreguntaSerializer,
    RecentResponseSerializer,
    RespuestaFullSerializer,
    RespuestaUpdateSerializer
)

class PreguntaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Pregunta.objects.all()
    serializer_class = PreguntaSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        # Soft Delete
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
        # Retorna solo las encuestas activas
        return Encuesta.objects.filter(activo=True)

class EncuestaManagementListView(generics.ListAPIView):
    # Retorna TODAS (Activas e Inactivas) para el panel de Jefes
    queryset = Encuesta.objects.all().order_by('-fecha_creacion')
    serializer_class = EncuestaDetailSerializer
    permission_classes = [IsAuthenticated]

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
            
            # Determine data source based on content type
            content_type = request.content_type or ""
            is_multipart = 'multipart/form-data' in content_type
            
            if is_multipart:
                # En multipart, DRF suele poner los campos de texto en request.data o request.POST
                # Buscamos 'data' de forma exhaustiva
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
                # Standard JSON Request
                parsed_data = request.data

            serializer = RespuestaCreateSerializer(data=parsed_data)
            
            if serializer.is_valid():
                data = serializer.validated_data
                
                # 1. Crear Header
                header = RespuestaHeader.objects.create(
                    encuesta=encuesta,
                    usuario=request.user,
                    seccion=data.get('seccion'),
                    barrio=data.get('barrio')
                )

                # 2. Crear Detalles
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
                    
                    # Check for Photo
                    valor_foto = None
                    # [LEGACY FIX] No guardamos más en valor_foto para evitar duplicados.
                    # Se guardan solo en RespuestaFoto (abajo).
                                
                    detalle = RespuestaDetalle.objects.create(
                        header=header,
                        pregunta=pregunta,
                        valor_texto=valor_texto,
                        valor_numero=valor_numero,
                        valor_foto=valor_foto
                    )
                    
                    # Guardar Multiples Fotos
                    if is_multipart:
                         file_key = f"foto_{pregunta_id}"
                         if file_key in request.FILES:
                            files = request.FILES.getlist(file_key)
                            for f in files:
                                RespuestaFoto.objects.create(detalle=detalle, imagen=f)

                # Fecha Personalizada (Overriding)
                fecha_custom = data.get('fecha_custom')
                if fecha_custom:
                    header.fecha_envio = fecha_custom
                    header.save()

                return Response({"message": "Respuesta guardada correctamente"}, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            tb = traceback.format_exc()
            print(tb) # Logs del servidor
            return Response({
                "error": "Error interno al guardar la respuesta.",
                "details": str(e),
                "traceback": tb # Enviamos el traceback para verlo en el dashboard/alert
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from django.db.models import Count
from django.db.models.functions import TruncDate, TruncMonth, TruncYear

class RecentResponseListView(generics.ListAPIView):
    serializer_class = RecentResponseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Ultimas 5 respuestas (como pidió el jefe)
        return RespuestaHeader.objects.select_related('usuario', 'encuesta').order_by('-fecha_envio')[:5]

class EncuestaManagementListView(generics.ListAPIView):
    # Retorna TODAS (Activas e Inactivas) para el panel y Anexamos conteo
    serializer_class = EncuestaDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Encuesta.objects.annotate(conteo_respuestas=Count('respuestas')).order_by('-fecha_creacion')



class ContactosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, encuesta_id=None):
        # 1. Buscamos respuestas (Filtradas o Todas)
        if encuesta_id:
            respuestas = RespuestaHeader.objects.filter(encuesta_id=encuesta_id).prefetch_related('detalles__pregunta', 'encuesta')
        else:
            respuestas = RespuestaHeader.objects.all().prefetch_related('detalles__pregunta', 'encuesta')
        
        contactos = []

        for rta in respuestas:
            # Diccionario temporal para esta persona
            persona = {
                "id_respuesta": rta.id,
                "fecha": rta.fecha_envio,
                "encuesta_nombre": rta.encuesta.nombre,
                "nombre": "No especificado",
                "telefono": None,
                "barrio": rta.barrio or "Sin barrio"
            }
            
            # 2. Recorremos las preguntas respondidas para encontrar las claves
            for detalle in rta.detalles.all():
                titulo = detalle.pregunta.titulo.lower().strip()
                
                # Obtenemos el valor (Texto tiene prioridad, luego Numero string, luego nada)
                valor = detalle.valor_texto
                if not valor and detalle.valor_numero is not None:
                    valor = str(detalle.valor_numero)
                
                # Si no hay valor útil, saltamos
                if not valor or valor == 'None' or valor.strip() == '':
                    continue
                
                valor = valor.strip()

                # --- HEURÍSTICA MEJORADA ---
                
                # 1. Detectar Nombre
                if any(x in titulo for x in ["nombre", "apellido", "nombres", "apellidos", "nombre completo"]):
                    if persona["nombre"] == "No especificado":
                        persona["nombre"] = valor
                    else:
                        persona["nombre"] += f" {valor}"
                
                # 2. Detectar Teléfono (Usamos IF, no ELIF, por si el título es confuso)
                if any(x in titulo for x in ["celular", "telefono", "teléfono", "wsp", "whatsapp", "movil", "contacto", "tel", "telf", "cel"]):
                    persona["telefono"] = valor

            # 3. Solo agregamos si tiene teléfono
            if persona["telefono"]:
                contactos.append(persona)

        return Response(contactos)

from rest_framework import serializers

class ContactoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contacto
        fields = '__all__'

class ContactoListCreateView(generics.ListCreateAPIView):
    queryset = Contacto.objects.all().order_by('-ultima_actualizacion')
    serializer_class = ContactoSerializer
    permission_classes = [IsAuthenticated]

class ContactoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Contacto.objects.all()
    serializer_class = ContactoSerializer
    permission_classes = [IsAuthenticated]

from rest_framework.parsers import MultiPartParser
from .utils import importar_contactos_inteligente

class ContactoImportView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        # 1. Intentar archivo (CSV)
        archivo = request.FILES.get('file')
        tag = request.data.get('tag', 'Importacion CSV')

        if archivo:
            try:
                total, creados = importar_contactos_inteligente(archivo, tag)
                return Response({
                    "status": "success",
                    "message": f"Procesados {total} filas. Se crearon {creados} contactos nuevos (o se actualizaron existentes).",
                    "creados": creados,
                    "actualizados": total - creados # Aproximación
                })
            except Exception as e:
                import traceback
                traceback.print_exc()
                return Response({"error": f"Error procesando CSV: {str(e)}"}, status=500)

        # 2. Fallback JSON (Legacy o uso directo)
        # Si no hay archivo, intentamos leer JSON del body 'contactos'
        # Nota: MultiPartParser a veces complica leer JSON raw, pero si el cliente manda JSON con content-type application/json
        # DRF usa el parser correcto si no forzamos solo MultiPart.
        # Pero arriba puse parser_classes = [MultiPartParser], lo que fuerza multipart.
        # Si queremos soportar ambos, deberíamos poner [MultiPartParser, JSONParser] o quitar parser_classes explícito
        # y dejar que DRF decida.
        
        # Para cumplir con el requerimiento del usuario "Paso 3: Usarlo en tu View" donde pone explícitamente MultiPartParser,
        # lo dejaremos así para el archivo. Si queremos mantener compatibilidad JSON, lo manejaremos:
        
        return Response({"error": "No se envió archivo ('file')"}, status=400)

class ExportarContactosCSV(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, encuesta_id=None):
        # 1. Reutilizamos la lógica 
        if encuesta_id:
            respuestas = RespuestaHeader.objects.filter(encuesta_id=encuesta_id).prefetch_related('detalles__pregunta', 'encuesta')
        else:
            respuestas = RespuestaHeader.objects.all().prefetch_related('detalles__pregunta', 'encuesta')

        contactos = []

        for rta in respuestas:
            persona = {
                "id_respuesta": rta.id,
                "encuesta_nombre": rta.encuesta.nombre,
                "fecha": rta.fecha_envio,
                "nombre": "No especificado",
                "telefono": None,
                "barrio": rta.barrio or "Sin barrio"
            }
            
            for detalle in rta.detalles.all():
                titulo = detalle.pregunta.titulo.lower().strip()
                
                valor = detalle.valor_texto
                if not valor and detalle.valor_numero is not None:
                    valor = str(detalle.valor_numero)
                
                if not valor or valor == 'None' or valor.strip() == '':
                    continue
                
                valor = valor.strip()

                if any(x in titulo for x in ["nombre", "apellido", "nombres", "apellidos", "nombre completo"]):
                    if persona["nombre"] == "No especificado":
                        persona["nombre"] = valor
                    else:
                        persona["nombre"] += f" {valor}"
                
                if any(x in titulo for x in ["celular", "telefono", "teléfono", "wsp", "whatsapp", "movil", "contacto", "tel", "telf", "cel"]):
                    persona["telefono"] = valor
            
            if persona["telefono"]:
                contactos.append(persona)
        
        # 2. Generar CSV
        response = HttpResponse(content_type='text/csv')
        filename = f"contactos_encuesta_{encuesta_id}.csv" if encuesta_id else "todos_los_contactos.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        writer.writerow(['ID', 'Fecha', 'Encuesta', 'Nombre Detectado', 'Teléfono Detectado', 'Barrio'])

        for c in contactos:
            writer.writerow([
                c['id_respuesta'], 
                c['fecha'].strftime('%Y-%m-%d %H:%M'), 
                c['encuesta_nombre'],
                c['nombre'], 
                c['telefono'], 
                c['barrio']
            ])

        return response

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
        
        # 1. Preparar Buffer ZIP
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # 2. Generar CSV
            # Recuperamos preguntas activas para armar los headers dinámicos
            preguntas = encuesta.preguntas.filter(activa=True).order_by('orden')
            headers_static = ['ID Respuesta', 'Fecha', 'Usuario', 'Barrio', 'Seccion']
            headers_dinamicos = [f"P{p.orden}: {p.titulo}" for p in preguntas]
            
            csv_buffer = io.StringIO()
            writer = csv.writer(csv_buffer)
            writer.writerow(headers_static + headers_dinamicos)

            respuestas = RespuestaHeader.objects.filter(encuesta=encuesta).select_related('usuario').prefetch_related('detalles__pregunta', 'detalles__fotos_extra')

            for rta in respuestas:
                # Datos Estáticos
                row = [
                    rta.id,
                    rta.fecha_envio.strftime('%Y-%m-%d %H:%M'),
                    rta.usuario.username if rta.usuario else 'Anónimo',
                    rta.barrio or '-',
                    rta.seccion or '-'
                ]

                # Datos Dinámicos (Preguntas)
                detalles_map = {d.pregunta_id: d for d in rta.detalles.all()}
                
                for p in preguntas:
                    val = ""
                    detalle = detalles_map.get(p.id)
                    if detalle:
                        # 3. Manejar Imagenes (Multiples o Simple)
                        fotos = list(detalle.fotos_extra.all())
                        
                        if fotos:
                            # CASO MULTIPLE (Nuevo)
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
                            # CASO SIMPLE (Legacy)
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
                            # Texto o Numero
                            val = detalle.valor_texto or str(detalle.valor_numero) if detalle.valor_numero is not None else ""
                    
                    row.append(val)
                
                writer.writerow(row)

            # Escribir CSV al ZIP
            zip_file.writestr('respuestas.csv', csv_buffer.getvalue())

        # 4. Devolver Respuesta
        zip_buffer.seek(0)
        response = HttpResponse(zip_buffer, content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="Reporte_Completo_{encuesta.id}.zip"'
        return response

class GlobalStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', 'day')
        group_by = request.query_params.get('group_by', 'date')
        if group_by:
            group_by = group_by.strip().lower()
        
        qs = RespuestaHeader.objects.all()

        if group_by == 'user':
            from django.db.models import Count
            # Agrupar por el ID del usuario para evitar duplicaciones
            stats = qs.values('usuario').annotate(count=Count('id')).order_by('-count')
            
            data = []
            for item in stats:
                uid = item['usuario']
                try:
                    user = User.objects.get(id=uid)
                    # Lógica consistente para el nombre
                    if user.first_name or user.last_name:
                        name = f"{user.first_name} {user.last_name}".strip()
                    else:
                        name = user.username or "Anónimo"
                    
                    picture_url = None
                    if user.profile_picture:
                        url = user.profile_picture.url
                        picture_url = request.build_absolute_uri(url)
                        # Forzar HTTPS si es nuestro dominio para evitar Mixed Content
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
            # Agrupar por Fecha (Logica anterior)
            if period == 'year':
                trunc_func = TruncYear('fecha_envio')
            elif period == 'month':
                trunc_func = TruncMonth('fecha_envio')
            else:
                trunc_func = TruncDate('fecha_envio')

            stats = qs.annotate(date=trunc_func).values('date').annotate(count=Count('id')).order_by('date')
            
            data = [
                {
                    "name": item['date'].strftime('%Y-%m-%d') if period == 'day' else (item['date'].strftime('%Y-%m') if period == 'month' else item['date'].strftime('%Y')),
                    "value": item['count']
                }
                for item in stats
            ]
        
        return Response(data)


class RespuestaUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = RespuestaHeader.objects.all()
    serializer_class = RespuestaUpdateSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        import json
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Intercept multipart to parse JSON 'data' field logic (consistent with CreateView)
        content_type = request.content_type or ""
        if 'multipart/form-data' in content_type:
             raw_json = request.data.get('data') or request.POST.get('data')
             if raw_json:
                 try:
                     parsed_data = json.loads(raw_json)
                     # Merge parsed data with request data (files remain in request.FILES)
                     # We can instantiate serializer with parsed_data
                     serializer = self.get_serializer(instance, data=parsed_data, partial=partial)
                     
                     if serializer.is_valid():
                         self.perform_update(serializer)
                         
                         if getattr(instance, '_prefetched_objects_cache', None):
                             # If 'prefetch_related' has been applied to a queryset, we need to
                             # forcibly invalidate the prefetch cache on the instance.
                             instance._prefetched_objects_cache = {}
                             
                         return Response(serializer.data)
                     else:
                        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

                 except Exception as e:
                     return Response({"error": f"JSON inválido en 'data': {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        # Standard behavior
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        # 1. Guardar cambios básicos (texto/numero/seccion/barrio)
        header = serializer.save()
        
        # 2. Manejar imágenes si es multipart (AGREGAR)
        # Note: self.request is available here
        content_type = self.request.content_type or ""
        if 'multipart/form-data' in content_type:
            # Iteramos sobre los archivos recibidos para ver a qué pregunta corresponden
            for key, files in self.request.FILES.lists():
                # Esperamos claves tipo "foto_123" donde 123 es el id de la pregunta
                if key.startswith('foto_'):
                    try:
                        pregunta_id = int(key.split('_')[1])
                    except (IndexError, ValueError):
                        continue
                    
                    if not files: continue
                    
                    # Buscamos o creamos el detalle para esta pregunta
                    # (Si la pregunta estaba vacía, no tiene detalle aún)
                    detalle, created = RespuestaDetalle.objects.get_or_create(
                        header=header,
                        pregunta_id=pregunta_id,
                        defaults={'encuesta_id': header.encuesta_id}
                    )
                    
                    # Guardar las fotos
                    for f in files:
                        RespuestaFoto.objects.create(detalle=detalle, imagen=f)

        # 3. ELIMINAR FOTOS (Lógica solicitada)
        # Check both parsed data (if we injected it?) No, request.data might be raw or parsed depending on above.
        # But if we used the 'data' trick above, 'delete_extra_ids' is in the parsed dict, NOT in request.data directly necessarily if DRF didn't parse it.
        
        # To be safe, look in the serializer.initial_data if available, or try to get from request again.
        # If we passed `data` to serializer, it's there.
        
        data = serializer.initial_data # This should hold the dict we passed
        
        # Helper para parsear listas
        
        # Helper para parsear listas (por si vienen en FormData json string o list)
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
            # Borrar fotos extra vinculadas a detalles de este header (seguridad)
            RespuestaFoto.objects.filter(
                id__in=delete_extras, 
                detalle__header=header
            ).delete()

        delete_legacy = parse_ids('delete_legacy_detail_ids')
        if delete_legacy:
            # Limpiar valor_foto de detalles de este header
            RespuestaDetalle.objects.filter(
                id__in=delete_legacy,
                header=header
            ).update(valor_foto=None)
