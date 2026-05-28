import csv
import io
from django.http import HttpResponse
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser
from .models import Contacto
from .serializers import ContactoSerializer
from .utils import importar_contactos_inteligente 
from surveys.models import RespuestaHeader 

class ContactoListCreateView(generics.ListCreateAPIView):
    queryset = Contacto.objects.all().order_by('-ultima_actualizacion')
    serializer_class = ContactoSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

class ContactoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Contacto.objects.all()
    serializer_class = ContactoSerializer
    permission_classes = [IsAuthenticated]

class ContactoImportView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        archivo = request.FILES.get('file')
        tag = request.data.get('tag', 'Importacion CSV')

        if archivo:
            try:
                total, creados = importar_contactos_inteligente(archivo, tag) 
                
                return Response({
                    "status": "success",
                    "message": f"Procesadas {total} filas. Se crearon {creados} contactos nuevos.",
                    "total_procesados": total,
                    "nuevos_contactos": creados,
                    "actualizados_o_omitidos": total - creados 
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                import traceback
                traceback.print_exc()
                return Response({"error": f"Error procesando CSV: {str(e)}"}, status=500)

        return Response({"error": "No se envió archivo ('file')"}, status=400)

class ContactosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, encuesta_id=None):
        if encuesta_id:
            respuestas = RespuestaHeader.objects.filter(encuesta_id=encuesta_id).prefetch_related('detalles__pregunta', 'encuesta')
        else:
            respuestas = RespuestaHeader.objects.all().prefetch_related('detalles__pregunta', 'encuesta')
        
        contactos = []

        for rta in respuestas:
            persona = {
                "id_respuesta": rta.id,
                "fecha": rta.fecha_envio,
                "encuesta_nombre": rta.encuesta.nombre,
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

        return Response(contactos)