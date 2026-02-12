from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Informe
from .serializers import InformeSerializer

class InformeCreateView(generics.CreateAPIView):
    queryset = Informe.objects.all()
    serializer_class = InformeSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

from surveys.models import RespuestaFoto
from surveys.serializers import RespuestaFotoSerializer

class GaleriaFotosView(generics.ListAPIView):
    permission_classes = [IsAuthenticated] 
    queryset = RespuestaFoto.objects.all().order_by('-id')
    serializer_class = RespuestaFotoSerializer
