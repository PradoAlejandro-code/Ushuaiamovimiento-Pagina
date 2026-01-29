from django.db import models
from django.conf import settings
import os
import uuid
from django.utils.timezone import now

def generar_ruta_imagen(instance, filename):
    ext = filename.split('.')[-1]
    nuevo_nombre = f"{uuid.uuid4()}.{ext}"
    fecha = now()
    return f"encuestas/respuestas/{fecha.year}/{fecha.month:02d}/{fecha.day:02d}/{nuevo_nombre}"

class Encuesta(models.Model):
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(default=now)
    activo = models.BooleanField(default=True)

    es_relevamiento = models.BooleanField(default=False)
    requiere_ubicacion = models.BooleanField(default=False)
    incluir_fecha = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.nombre} ({'Relevamiento' if self.es_relevamiento else 'Encuesta'})"

class Pregunta(models.Model):
    TIPO_TEXTO = 'texto'
    TIPO_NUMERO = 'numero'
    TIPO_OPCIONES = 'opciones'
    TIPO_TELEFONO = 'telefono'
    TIPO_FOTO = 'foto'

    TIPO_CHOICES = [
        (TIPO_TEXTO, 'Texto Libre'),
        (TIPO_NUMERO, 'Numérico'),
        (TIPO_OPCIONES, 'Opciones'),
        (TIPO_TELEFONO, 'Teléfono (+54)'),
        (TIPO_FOTO, 'Foto'),
    ]

    encuesta = models.ForeignKey(Encuesta, on_delete=models.CASCADE, related_name='preguntas')
    titulo = models.CharField(max_length=255)
    orden = models.IntegerField(default=0)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default=TIPO_TEXTO)
    activa = models.BooleanField(default=True, help_text="Si es False, la pregunta no se muestra pero no se borran sus datos.")
    obligatoria = models.BooleanField(default=False)
    
    opciones = models.JSONField(null=True, blank=True, help_text='Lista de opciones ej: ["Si", "No"]')

    class Meta:
        ordering = ['orden']

    def __str__(self):
        return f"{self.orden} - {self.titulo} ({self.encuesta.nombre})"

class Contacto(models.Model):
    nombre = models.CharField(max_length=255)
    celular = models.CharField(max_length=20, unique=True) # El celular es el identificador único
    tag = models.CharField(max_length=50, default="encuesta")
    ultima_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre} ({self.celular})"

class RespuestaHeader(models.Model):
    encuesta = models.ForeignKey(Encuesta, on_delete=models.PROTECT, related_name='respuestas')
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='encuestas_respondidas')
    # Relación de clave foránea vinculada
    contacto = models.ForeignKey(Contacto, on_delete=models.SET_NULL, null=True, blank=True, related_name="encuestas_respondidas")

    # Change: allow custom date, defaulting to now
    fecha_envio = models.DateTimeField(default=now)
    
    # Campos de Ubicación (Solo si es relevamiento, pueden ser null)
    seccion = models.CharField(max_length=100, null=True, blank=True)
    barrio = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return f"Respuesta de {self.usuario} a {self.encuesta.nombre} - {self.fecha_envio.strftime('%Y-%m-%d')}"

class RespuestaDetalle(models.Model):
    header = models.ForeignKey(RespuestaHeader, on_delete=models.CASCADE, related_name='detalles')
    pregunta = models.ForeignKey(Pregunta, on_delete=models.PROTECT, related_name='respuestas_recibidas')
    
    # Separación de Valores para Analytics
    valor_texto = models.TextField(null=True, blank=True)
    valor_numero = models.FloatField(null=True, blank=True)
    # Legacy field (keep for backward compat or single photo) - we will mostly use RespuestaFoto now
    valor_foto = models.ImageField(upload_to=generar_ruta_imagen, null=True, blank=True)

    def __str__(self):
        return f"Rta {self.pregunta.orden}: {self.valor_texto or self.valor_numero or 'Foto'}"

class RespuestaFoto(models.Model):
    detalle = models.ForeignKey(RespuestaDetalle, on_delete=models.CASCADE, related_name='fotos_extra')
    imagen = models.ImageField(upload_to=generar_ruta_imagen)
    
    def __str__(self):
        return f"Foto para {self.detalle}"

class Seccion(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.nombre

class Barrio(models.Model):
    nombre = models.CharField(max_length=100)
    seccion = models.ForeignKey(Seccion, on_delete=models.CASCADE, related_name='barrios')

    class Meta:
        unique_together = ('nombre', 'seccion')
    def __str__(self):
        return f"{self.nombre} ({self.seccion.nombre})"
