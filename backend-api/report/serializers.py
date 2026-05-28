from rest_framework import serializers
from .models import Informe
from surveys.models import Foto
from surveys.serializers import FotoSerializer

class InformeSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.ReadOnlyField(source='creado_por.get_full_name')
    creado_por_foto = serializers.SerializerMethodField()
    
    fotos = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Foto.objects.all(),
        required=False
    )
    fotos_detalle = FotoSerializer(source='fotos', many=True, read_only=True)

    class Meta:
        model = Informe
        fields = [
            'id', 'titulo', 'descripcion_breve', 'cuerpo', 
            'seccion', 'barrio', 'fotos', 'fotos_detalle', 'fecha_creacion',
            'creado_por_nombre', 'creado_por_foto'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'creado_por']

    def get_creado_por_foto(self, obj):
        if obj.creado_por.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.creado_por.profile_picture.url)
            return obj.creado_por.profile_picture.url
        return None

    def create(self, validated_data):
        fotos_data = validated_data.pop('fotos', [])
        informe = Informe.objects.create(**validated_data)
        informe.fotos.set(fotos_data)
        return informe

    def update(self, instance, validated_data):
        fotos_data = validated_data.pop('fotos', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if fotos_data is not None:
            instance.fotos.set(fotos_data)
        
        return instance
