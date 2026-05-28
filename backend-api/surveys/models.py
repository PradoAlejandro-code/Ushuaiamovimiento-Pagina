from django.db import models
import os
from django.conf import settings
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
    activar_encuestador_manual = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.nombre} ({'Relevamiento' if self.es_relevamiento else 'Encuesta'})"

class Grupo(models.Model):
    encuesta = models.ForeignKey(Encuesta, on_delete=models.CASCADE, related_name='grupos')
    nombre = models.CharField(max_length=200)
    orden = models.IntegerField(default=0)

    class Meta:
        ordering = ['orden', 'id']

    def __str__(self):
        return f"{self.nombre} ({self.encuesta.nombre})"

class Pregunta(models.Model):
    TIPO_TEXTO = 'texto'
    TIPO_NUMERO = 'numero'
    TIPO_OPCIONES = 'opciones'
    TIPO_TELEFONO = 'telefono'
    TIPO_FOTO = 'foto'
    # Nuevos tipos para extracción de datos
    TIPO_NOMBRE = 'nombre'
    TIPO_CELULAR = 'celular'
    TIPO_DNI = 'dni'
    TIPO_MAIL = 'mail'

    TIPO_CHOICES = [
        (TIPO_TEXTO, 'Texto Libre'),
        (TIPO_NUMERO, 'Numérico'),
        (TIPO_OPCIONES, 'Opciones'),
        (TIPO_TELEFONO, 'Teléfono (Legacy)'),
        (TIPO_FOTO, 'Foto'),
        (TIPO_NOMBRE, 'Nombre Completo'),
        (TIPO_CELULAR, 'Celular'),
        (TIPO_DNI, 'DNI'),
        (TIPO_MAIL, 'Email'),
    ]

    encuesta = models.ForeignKey(Encuesta, on_delete=models.CASCADE, related_name='preguntas')
    grupo = models.ForeignKey(Grupo, on_delete=models.SET_NULL, null=True, blank=True, related_name='preguntas', help_text="Grupo al que pertenece para visualización agrupada")
    titulo = models.CharField(max_length=255)
    orden = models.IntegerField(default=0)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default=TIPO_TEXTO)
    activa = models.BooleanField(default=True, help_text="Si es False, la pregunta no se muestra pero no se borran sus datos.")
    obligatoria = models.BooleanField(default=False)
    permite_multiple = models.BooleanField(default=False)
    
    opciones = models.JSONField(null=True, blank=True, help_text='Lista de opciones ej: ["Si", "No"]')

    class Meta:
        ordering = ['orden']

    def __str__(self):
        return f"{self.orden} - {self.titulo} ({self.encuesta.nombre})"



class RespuestaHeader(models.Model):
    encuesta = models.ForeignKey(Encuesta, on_delete=models.CASCADE, related_name='respuestas')
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='encuestas_respondidas')
    # Relación de clave foránea vinculada
    contacto = models.ForeignKey('contact.Contacto', on_delete=models.SET_NULL, null=True, blank=True, related_name="encuestas_respondidas")

    # Change: allow custom date, defaulting to now
    fecha_envio = models.DateTimeField(default=now, db_index=True)
    
    # Campos de Ubicación (Solo si es relevamiento, pueden ser null)
    seccion = models.CharField(max_length=100, null=True, blank=True)
    barrio = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return f"Respuesta de {self.usuario} a {self.encuesta.nombre} - {self.fecha_envio.strftime('%Y-%m-%d')}"

class RespuestaDetalle(models.Model):
    header = models.ForeignKey(RespuestaHeader, on_delete=models.CASCADE, related_name='detalles')
    pregunta = models.ForeignKey(Pregunta, on_delete=models.CASCADE, related_name='respuestas_recibidas')
    
    # Separación de Valores para Analytics
    valor_texto = models.TextField(null=True, blank=True)
    valor_numero = models.FloatField(null=True, blank=True)
    # SE ELIMINÓ: valor_foto (la columna vieja)

    def __str__(self):
        return f"Rta {self.pregunta.orden}: {self.valor_texto or self.valor_numero or 'Foto'}"

    # SE ELIMINÓ: El método save() con lógica de valor_foto

class RespuestaFoto(models.Model):
    detalle = models.ForeignKey(RespuestaDetalle, on_delete=models.CASCADE, related_name='fotos_extra')
    imagen = models.ImageField(upload_to=generar_ruta_imagen)
    
    def __str__(self):
        return f"Foto para {self.detalle}"

    def save(self, *args, **kwargs):
        # Primero guardamos el detalle normalmente
        super().save(*args, **kwargs)

        # Lógica DIRECTA para la entidad Foto
        if self.imagen:
            from .models import Foto # Import local para evitar importación circular
            Foto.objects.update_or_create(
                archivo=self.imagen,
                respuesta_id=self.detalle.header.id,
                encuesta_id=self.detalle.header.encuesta.id,
                defaults={
                    'barrio': self.detalle.header.barrio,
                    'seccion': self.detalle.header.seccion,
                    'fecha': self.detalle.header.fecha_envio
                }
            )

    def delete(self, *args, **kwargs):
        # Si el archivo no existe en el disco, forzamos que Django 
        # piense que no hay archivo para que no intente borrarlo físicamente
        # y evitar errores con django-cleanup
        try:
            # Lógica para borrar la entidad Foto vinculada (Galería de Evidencia)
            from .models import Foto
            if self.imagen and self.detalle and self.detalle.header:
                # El nombre en el ImageFieldFile es la ruta relativa desde MEDIA_ROOT
                nombre_archivo = self.imagen.name
                Foto.objects.filter(archivo=nombre_archivo, respuesta_id=self.detalle.header.id).delete()
            
            if self.imagen and not os.path.exists(self.imagen.path):
                self.imagen = None 
        except Exception:
            pass
        super().delete(*args, **kwargs)

class Seccion(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    
    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return self.nombre

class Barrio(models.Model):
    nombre = models.CharField(max_length=100)
    seccion = models.ForeignKey(Seccion, on_delete=models.CASCADE, related_name='barrios')

    class Meta:
        unique_together = ('nombre', 'seccion')
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.seccion.nombre})"

class Foto(models.Model):
    archivo = models.ImageField(upload_to='relevamientos/fotos/')
    
    # Usamos IDs para que sea universal sin importar qué tabla sea la encuesta
    respuesta_id = models.IntegerField(help_text="ID de la respuesta original")
    encuesta_id = models.IntegerField(help_text="ID de la encuesta a la que pertenece")
    
    # CAMPOS OPCIONALES: Para encuestas sin territorio
    barrio = models.CharField(max_length=100, null=True, blank=True)
    seccion = models.CharField(max_length=100, null=True, blank=True)
    
    # La fecha es vital para el filtrado cronológico
    fecha = models.DateTimeField(default=now)

    class Meta:
        verbose_name = "Foto"
        verbose_name_plural = "Fotos"
        # Indexamos para que la galería cargue rápido al filtrar
        indexes = [
            models.Index(fields=['barrio', 'seccion']),
            models.Index(fields=['fecha']),
        ]
        ordering = ['-fecha', '-id']

    def delete(self, *args, **kwargs):
        # Si el archivo no existe en el disco, forzamos que Django 
        # piense que no hay archivo para que no intente borrarlo físicamente
        # y evitar errores con django-cleanup
        try:
            if self.archivo and not os.path.exists(self.archivo.path):
                self.archivo = None 
        except Exception:
            self.archivo = None
        super(Foto, self).delete(*args, **kwargs)
