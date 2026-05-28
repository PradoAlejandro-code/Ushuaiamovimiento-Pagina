from rest_framework import serializers
from .models import Encuesta, Pregunta, RespuestaHeader, RespuestaDetalle, Seccion, Barrio, RespuestaFoto, Foto, Grupo

class FotoSerializer(serializers.ModelSerializer):
    archivo = serializers.SerializerMethodField()
    encuesta_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Foto
        fields = ['id', 'archivo', 'fecha', 'barrio', 'seccion', 'encuesta_id', 'encuesta_nombre']

    def get_archivo(self, obj):
        request = self.context.get('request')
        if obj.archivo:
            url = obj.archivo.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return None

    def get_encuesta_nombre(self, obj):
        try:
            return Encuesta.objects.get(id=obj.encuesta_id).nombre
        except Encuesta.DoesNotExist:
            return "Encuesta desconocida"

class GrupoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grupo
        fields = ['id', 'encuesta', 'nombre', 'orden']

class GrupoNestedSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    class Meta:
        model = Grupo
        fields = ['id', 'nombre', 'orden']

class PreguntaNestedSerializer(serializers.ModelSerializer):
    grupo_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    class Meta:
        model = Pregunta
        fields = ['id', 'titulo', 'orden', 'tipo', 'opciones', 'activa', 'obligatoria', 'permite_multiple', 'grupo_id']

class PreguntaSerializer(serializers.ModelSerializer):
    grupo_id = serializers.PrimaryKeyRelatedField(source='grupo', queryset=Grupo.objects.all(), required=False, allow_null=True)
    class Meta:
        model = Pregunta
        fields = ['id', 'encuesta', 'grupo_id', 'titulo', 'orden', 'tipo', 'opciones', 'activa', 'obligatoria', 'permite_multiple']

class EncuestaCreateSerializer(serializers.ModelSerializer):
    preguntas = PreguntaNestedSerializer(many=True)
    grupos = GrupoNestedSerializer(many=True, required=False)

    class Meta:
        model = Encuesta
        fields = ['nombre', 'descripcion', 'es_relevamiento', 'requiere_ubicacion', 'incluir_fecha', 'activar_encuestador_manual', 'preguntas', 'grupos', 'activo']

    def create(self, validated_data):
        preguntas_data = validated_data.pop('preguntas', [])
        grupos_data = validated_data.pop('grupos', [])
        
        encuesta = Encuesta.objects.create(**validated_data)
        
        grupo_map = {}
        for g_data in grupos_data:
            temp_id = g_data.pop('id', None)
            grupo_obj = Grupo.objects.create(encuesta=encuesta, **g_data)
            if temp_id:
                grupo_map[str(temp_id)] = grupo_obj
        
        for pregunta_data in preguntas_data:
            grupo_id_ref = pregunta_data.pop('grupo_id', None)
            grupo_obj = None
            if grupo_id_ref and str(grupo_id_ref) in grupo_map:
                grupo_obj = grupo_map[str(grupo_id_ref)]
                
            Pregunta.objects.create(encuesta=encuesta, grupo=grupo_obj, **pregunta_data)
            
        return encuesta

class EncuestaDetailSerializer(serializers.ModelSerializer):
    preguntas = serializers.SerializerMethodField()
    grupos = serializers.SerializerMethodField()
    conteo_respuestas = serializers.IntegerField(read_only=True)

    class Meta:
        model = Encuesta
        fields = ['id', 'nombre', 'descripcion', 'es_relevamiento', 'requiere_ubicacion', 'incluir_fecha', 'activar_encuestador_manual', 'grupos', 'preguntas', 'activo', 'conteo_respuestas', 'fecha_creacion']

    def get_grupos(self, obj):
        grupos_qs = obj.grupos.all().order_by('orden', 'id')
        return GrupoSerializer(grupos_qs, many=True).data

    def get_preguntas(self, obj):
        preguntas_activas = obj.preguntas.filter(activa=True).order_by('orden')
        return PreguntaSerializer(preguntas_activas, many=True).data

class RespuestaFotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RespuestaFoto
        fields = ['id', 'imagen']

    def validate_imagen(self, value):
        if not value or isinstance(value, str):
            return None
        return value

class RespuestaDetalleSerializer(serializers.ModelSerializer):
    valor = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    pregunta_id = serializers.IntegerField(required=False)
    fotos_detalle = RespuestaFotoSerializer(source='fotos_extra', many=True, read_only=True)

    class Meta:
        model = RespuestaDetalle
        fields = ['id', 'pregunta_id', 'valor', 'valor_texto', 'valor_numero', 'fotos_detalle']
        read_only_fields = ['valor_texto', 'valor_numero']

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



class RespuestaDetalleOutputSerializer(serializers.ModelSerializer):
    fotos_extra = RespuestaFotoSerializer(many=True, read_only=True)
    pregunta_titulo = serializers.CharField(source='pregunta.titulo', read_only=True)
    pregunta_tipo = serializers.CharField(source='pregunta.tipo', read_only=True)
    
    class Meta:
        model = RespuestaDetalle
        fields = ['pregunta', 'pregunta_titulo', 'pregunta_tipo', 'valor_texto', 'valor_numero', 'fotos_extra']

class RespuestaFullSerializer(serializers.ModelSerializer):
    usuario_id = serializers.IntegerField(source='usuario.id', read_only=True)
    usuario_nombre = serializers.SerializerMethodField()
    usuario_foto = serializers.SerializerMethodField()
    detalles = RespuestaDetalleOutputSerializer(many=True, read_only=True)
    fecha_format = serializers.SerializerMethodField()
    fotos_agrupadas = serializers.SerializerMethodField()

    class Meta:
        model = RespuestaHeader
        fields = ['id', 'fecha_envio', 'fecha_format', 'seccion', 'barrio', 'detalles', 'usuario_id', 'usuario_nombre', 'usuario_foto', 'contacto', 'fotos_agrupadas']
    
    def get_fotos_agrupadas(self, obj):
        fotos = Foto.objects.filter(respuesta_id=obj.id)
        return FotoSerializer(fotos, many=True, context=self.context).data

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

class RespuestaListSerializer(serializers.ModelSerializer):
    """
    Serializer optimizado para listas: Sin detalles, sin fotos anidadas.
    Solo lo mínimo indispensable para la tabla.
    """
    usuario_id = serializers.IntegerField(source='usuario.id', read_only=True)
    usuario_nombre = serializers.SerializerMethodField()
    usuario_foto = serializers.SerializerMethodField()
    fecha_format = serializers.SerializerMethodField()

    class Meta:
        model = RespuestaHeader
        fields = ['id', 'fecha_envio', 'fecha_format', 'seccion', 'barrio', 'usuario_id', 'usuario_nombre', 'usuario_foto', 'contacto']

    def get_fecha_format(self, obj):
        return obj.fecha_envio.strftime('%Y-%m-%d')

    def get_usuario_nombre(self, obj):
        if obj.usuario.first_name or obj.usuario.last_name:
            return f"{obj.usuario.first_name} {obj.usuario.last_name}".strip()
        return obj.usuario.username

    def get_usuario_foto(self, obj):
        try:
            request = self.context.get('request')
            if obj.usuario.profile_picture:
                url = obj.usuario.profile_picture.url
                if request:
                    return request.build_absolute_uri(url)
                return url
        except Exception:
            pass
        return None
class RespuestaUpdateSerializer(serializers.ModelSerializer):
    detalles = RespuestaDetalleSerializer(many=True, required=False)
    borrar_foto_principal_ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    borrar_fotos_extra_ids = serializers.ListField(child=serializers.IntegerField(), required=False)

    class Meta:
        model = RespuestaHeader
        fields = ['id', 'seccion', 'barrio', 'detalles', 'borrar_foto_principal_ids', 'borrar_fotos_extra_ids']

    def update(self, instance, validated_data):
        detalles_data = validated_data.pop('detalles', None)
        borrar_extra_ids = validated_data.pop('borrar_fotos_extra_ids', [])
        borrar_main_ids = validated_data.pop('borrar_foto_principal_ids', [])
        
        if borrar_extra_ids:
            fotos_a_borrar = RespuestaFoto.objects.filter(id__in=borrar_extra_ids)
            for f in fotos_a_borrar:
                try:
                    f.delete()
                except Exception:
                    pass
        if borrar_main_ids:
            from .models import Foto
            try:
                Foto.objects.filter(id__in=borrar_main_ids, respuesta_id=instance.id).delete()
            except Exception:
                pass
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

                detalle_obj, created = RespuestaDetalle.objects.get_or_create(
                    header=instance,
                    pregunta=pregunta
                )

                if valor is not None:
                    detalle_obj.valor_texto = str(valor)
                    if pregunta.tipo == 'numero':
                        try:
                            detalle_obj.valor_numero = float(valor)
                        except (ValueError, TypeError):
                            detalle_obj.valor_numero = None
                    else:
                        detalle_obj.valor_numero = None
                    detalle_obj.save()
        try:
            from .models import Foto
            fotos_gallery = Foto.objects.filter(respuesta_id=instance.id)
       
            nombres_validos = set(RespuestaFoto.objects.filter(detalle__header=instance).values_list('imagen', flat=True))
            nombres_validos.update(RespuestaDetalle.objects.filter(header=instance).exclude(valor_foto='').values_list('valor_foto', flat=True))
            
            for f_g in fotos_gallery:
                if f_g.archivo.name not in nombres_validos:
                    f_g.delete()
        except Exception:
            pass

        return instance
