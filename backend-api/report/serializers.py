from rest_framework import serializers
from .models import Informe

class InformeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Informe
        fields = ['id', 'titulo', 'descripcion_breve', 'cuerpo', 'seccion', 'barrio', 'foto', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion', 'creado_por']
