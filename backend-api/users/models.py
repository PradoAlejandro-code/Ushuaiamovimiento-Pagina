from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid
from django.utils.timezone import now
from image_cropping import ImageRatioField

def generar_ruta_perfil(instance, filename):
    ext = filename.split('.')[-1]
    nuevo_nombre = f"{uuid.uuid4()}.{ext}"
    fecha = now()
    return f"perfiles/{fecha.year}/{fecha.month:02d}/{fecha.day:02d}/{nuevo_nombre}"

class User(AbstractUser):
    ADMIN = 'admin'
    JEFE = 'jefe'
    EMPLEADO = 'empleado'

    ROLE_CHOICES = [
        (ADMIN, 'Admin'),
        (JEFE, 'Jefe'),
        (EMPLEADO, 'Empleado'),
    ]

    email = models.EmailField(unique=True)
    profile_picture = models.ImageField(upload_to=generar_ruta_perfil, blank=True, null=True)
    cropping = ImageRatioField('profile_picture', '400x400')
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=EMPLEADO)
    
    username = models.CharField(max_length=150, unique=False, blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
