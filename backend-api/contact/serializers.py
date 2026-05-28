from rest_framework import serializers
from .models import Contacto

class ContactoSerializer(serializers.ModelSerializer):
    primera_respuesta_id = serializers.SerializerMethodField()
    primera_encuesta_id = serializers.SerializerMethodField()

    class Meta:
        model = Contacto
        fields = '__all__'

    def get_primera_respuesta_id(self, obj):
        primera_respuesta = obj.encuestas_respondidas.order_by('fecha_envio').first()
        return primera_respuesta.id if primera_respuesta else None

    def get_primera_encuesta_id(self, obj):
        primera_respuesta = obj.encuestas_respondidas.order_by('fecha_envio').first()
        return primera_respuesta.encuesta_id if primera_respuesta else None
