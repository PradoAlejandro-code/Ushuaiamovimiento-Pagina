from django.db import models

class Contacto(models.Model):
    nombre = models.CharField(max_length=255)
    celular = models.CharField(max_length=20, unique=True) # El celular es el identificador único
    email = models.EmailField(null=True, blank=True)
    dni = models.CharField(max_length=20, null=True, blank=True)
    tag = models.CharField(max_length=50, default="encuesta")
    ultima_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre} ({self.celular})"
