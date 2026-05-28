from django.db import models
from django.conf import settings
from surveys.models import Seccion, Barrio, Foto

class Informe(models.Model):
    titulo = models.CharField(max_length=200)
    descripcion_breve = models.CharField(max_length=500, blank=True, null=True)
    cuerpo = models.TextField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    seccion = models.ForeignKey(Seccion, on_delete=models.SET_NULL, null=True, blank=True)
    barrio = models.ForeignKey(Barrio, on_delete=models.SET_NULL, null=True, blank=True)
    fotos = models.ManyToManyField(Foto, blank=True)
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    def __str__(self):
        return self.titulo
