from rest_framework import serializers
from .models import Encuesta, Pregunta, RespuestaHeader, RespuestaDetalle, Seccion, Barrio, RespuestaFoto

class PreguntaNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pregunta
        fields = ['id', 'titulo', 'orden', 'tipo', 'opciones', 'activa', 'obligatoria']

class PreguntaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pregunta
        fields = ['id', 'encuesta', 'titulo', 'orden', 'tipo', 'opciones', 'activa', 'obligatoria']

class EncuestaCreateSerializer(serializers.ModelSerializer):
    preguntas = PreguntaNestedSerializer(many=True)

    class Meta:
        model = Encuesta
        fields = ['nombre', 'descripcion', 'es_relevamiento', 'requiere_ubicacion', 'incluir_fecha', 'preguntas', 'activo']

    def create(self, validated_data):
        preguntas_data = validated_data.pop('preguntas')
        
        encuesta = Encuesta.objects.create(**validated_data)
        
        for pregunta_data in preguntas_data:
            Pregunta.objects.create(encuesta=encuesta, **pregunta_data)
            
        return encuesta

class EncuestaDetailSerializer(serializers.ModelSerializer):
    preguntas = serializers.SerializerMethodField()
    conteo_respuestas = serializers.IntegerField(read_only=True)

    class Meta:
        model = Encuesta
        fields = ['id', 'nombre', 'descripcion', 'es_relevamiento', 'requiere_ubicacion', 'incluir_fecha', 'preguntas', 'activo', 'conteo_respuestas', 'fecha_creacion']

    def get_preguntas(self, obj):
        # Solo devolvemos las preguntas activas
        preguntas_activas = obj.preguntas.filter(activa=True).order_by('orden')
        return PreguntaSerializer(preguntas_activas, many=True).data

class RespuestaDetalleSerializer(serializers.Serializer):
    pregunta_id = serializers.IntegerField()
    valor = serializers.CharField(allow_blank=True, allow_null=True) 

class RespuestaCreateSerializer(serializers.Serializer):
    respuestas = RespuestaDetalleSerializer(many=True)
    seccion = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    barrio = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    fecha_custom = serializers.DateTimeField(required=False, allow_null=True)

class BarrioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Barrio
        fields = ['id', 'nombre']

class SeccionSerializer(serializers.ModelSerializer):
    barrios = BarrioSerializer(many=True, read_only=True)

    class Meta:
        model = Seccion
        fields = ['id', 'nombre', 'barrios']

class RecentResponseSerializer(serializers.ModelSerializer):
    encuesta_nombre = serializers.CharField(source='encuesta.nombre', read_only=True)
    usuario_nombre = serializers.SerializerMethodField()
    usuario_foto = serializers.SerializerMethodField()
    fecha_format = serializers.SerializerMethodField()

    class Meta:
        model = RespuestaHeader
        fields = ['id', 'encuesta_nombre', 'usuario_nombre', 'usuario_foto', 'fecha_envio', 'fecha_format', 'seccion', 'barrio', 'contacto']

    def get_usuario_nombre(self, obj):
        if obj.usuario.first_name or obj.usuario.last_name:
            return f"{obj.usuario.first_name} {obj.usuario.last_name}".strip()
        return obj.usuario.username

    def get_usuario_foto(self, obj):
        request = self.context.get('request')
        if obj.usuario.profile_picture:
            url = obj.usuario.profile_picture.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return None

    def get_fecha_format(self, obj):
        return obj.fecha_envio.strftime('%d/%m/%Y %H:%M')

class RespuestaFotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RespuestaFoto
        fields = ['id', 'imagen']

class RespuestaDetalleOutputSerializer(serializers.ModelSerializer):
    fotos_extra = RespuestaFotoSerializer(many=True, read_only=True)
    
    class Meta:
        model = RespuestaDetalle
        fields = ['pregunta', 'valor_texto', 'valor_numero', 'valor_foto', 'fotos_extra']

class RespuestaFullSerializer(serializers.ModelSerializer):
    usuario_id = serializers.IntegerField(source='usuario.id', read_only=True)
    usuario_nombre = serializers.SerializerMethodField()
    usuario_foto = serializers.SerializerMethodField()
    detalles = RespuestaDetalleOutputSerializer(many=True, read_only=True)
    fecha_format = serializers.SerializerMethodField()

    class Meta:
        model = RespuestaHeader
        fields = ['id', 'fecha_envio', 'fecha_format', 'seccion', 'barrio', 'detalles', 'usuario_id', 'usuario_nombre', 'usuario_foto', 'contacto']

    def get_fecha_format(self, obj):
        return obj.fecha_envio.strftime('%Y-%m-%d')

    def get_usuario_nombre(self, obj):
        if obj.usuario.first_name or obj.usuario.last_name:
            return f"{obj.usuario.first_name} {obj.usuario.last_name}".strip()
        return obj.usuario.username

    def get_usuario_foto(self, obj):
        request = self.context.get('request')
        if obj.usuario.profile_picture:
            url = obj.usuario.profile_picture.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return None
class RespuestaUpdateSerializer(serializers.ModelSerializer):
    detalles = RespuestaDetalleSerializer(many=True, required=False)

    class Meta:
        model = RespuestaHeader
        fields = ['id', 'seccion', 'barrio', 'detalles']

    def update(self, instance, validated_data):
        detalles_data = validated_data.pop('detalles', None)
        
        # Actualizar campos de cabecera
        instance.seccion = validated_data.get('seccion', instance.seccion)
        instance.barrio = validated_data.get('barrio', instance.barrio)
        instance.save()

        if detalles_data is not None:
            for d_data in detalles_data:
                pregunta_id = d_data.get('pregunta_id')
                valor = d_data.get('valor')
                
                try:
                    pregunta = Pregunta.objects.get(id=pregunta_id, encuesta=instance.encuesta)
                except Pregunta.DoesNotExist:
                    continue

                # Buscar o crear el detalle
                detalle, created = RespuestaDetalle.objects.get_or_create(
                    header=instance,
                    pregunta=pregunta
                )

                # Actualizar valores según tipo
                detalle.valor_texto = str(valor) if valor is not None else ""
                
                if pregunta.tipo == 'numero' and valor:
                    try:
                        detalle.valor_numero = float(valor)
                    except ValueError:
                        detalle.valor_numero = None
                else:
                    detalle.valor_numero = None
                
                # Para fotos en actualización, se manejaría en la View si hay multipart
                # Por ahora solo actualizamos texto/número aquí
                detalle.save()

        return instance
