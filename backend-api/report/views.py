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

class InformeListView(generics.ListAPIView):
    queryset = Informe.objects.all().order_by('-fecha_creacion')
    serializer_class = InformeSerializer
    permission_classes = [IsAuthenticated]

class InformeDeleteView(generics.DestroyAPIView):
    queryset = Informe.objects.all()
    serializer_class = InformeSerializer
    permission_classes = [IsAuthenticated]

from surveys.models import Foto
from surveys.serializers import FotoSerializer

class GaleriaFotosView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FotoSerializer

    def get_queryset(self):
        queryset = Foto.objects.all().order_by('-fecha', '-id')

        seccion = self.request.query_params.get('seccion')
        barrio = self.request.query_params.get('barrio')
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        encuesta_id = self.request.query_params.get('encuesta_id')

        if seccion:
            queryset = queryset.filter(seccion=seccion)
        if barrio:
            queryset = queryset.filter(barrio=barrio)
        if fecha_desde:
            queryset = queryset.filter(fecha__date__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha__date__lte=fecha_hasta)
        if encuesta_id:
            queryset = queryset.filter(encuesta_id=encuesta_id)

        return queryset
