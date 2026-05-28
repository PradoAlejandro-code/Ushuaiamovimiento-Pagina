from django.db import models
from django.conf import settings
from datetime import date

class EnrollmentList(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    ui_settings = models.JSONField(default=dict, blank=True)
    last_import_status = models.CharField(max_length=50, default='none') # none, processing, completed, error
    last_import_stats = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.name

class ListField(models.Model):
    """Aquí defines qué datos pide cada padrón"""
    FIELD_TYPES = (
        ('text', 'Texto Corto'),
        ('number', 'Número'),
        ('date', 'Fecha'),
        ('email', 'Correo Electrónico'),
    )
    enrollment_list = models.ForeignKey(EnrollmentList, on_delete=models.CASCADE, related_name='fields')
    name = models.CharField(max_length=255)
    label = models.CharField(max_length=255, blank=True)
    field_type = models.CharField(max_length=50, choices=FIELD_TYPES, default='text')
    
    # Configuración de UI
    is_visible = models.BooleanField(default=True)
    is_searchable = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def save(self, *args, **kwargs):
        if not self.label:
            self.label = self.name
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.enrollment_list.name})"

class Person(models.Model):
    first_name = models.CharField(max_length=255, blank=True, null=True)
    last_name = models.CharField(max_length=255, blank=True, null=True)
    dni = models.CharField(max_length=20, unique=True, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    birth_date = models.DateField(blank=True, null=True)
    GENDER_CHOICES = (
        ('M', 'Masculino'),
        ('F', 'Femenino'),
    )
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    profession = models.CharField(max_length=255, blank=True, null=True)
    employment_status = models.CharField(max_length=255, default='', blank=True, null=True)
    workplace = models.CharField(max_length=255, blank=True, null=True)
    age = models.IntegerField(blank=True, null=True)
    city = models.CharField(max_length=255, default='USHUAIA')
    is_affiliate = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Convertir campos de texto a mayúsculas antes de guardar
        if self.first_name: self.first_name = self.first_name.upper()
        if self.last_name: self.last_name = self.last_name.upper()
        if self.address: self.address = self.address.upper()
        if self.profession: self.profession = self.profession.upper()
        if self.employment_status: self.employment_status = self.employment_status.upper()
        if self.workplace: self.workplace = self.workplace.upper()
        if self.city: self.city = self.city.upper()
        if self.dni: self.dni = self.dni.upper()

        # Calcular edad si hay fecha de nacimiento
        if self.birth_date:
            today = date.today()
            self.age = today.year - self.birth_date.year - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.dni or 'S/D'})"

class Enrollee(models.Model):
    """
    La persona y TODOS sus datos dinámicos se guardan en una sola fila usando JSONField.
    Ahora vinculado a una persona central si existe.
    """
    enrollment_list = models.ForeignKey(EnrollmentList, on_delete=models.CASCADE, related_name='enrollees')
    person = models.ForeignKey(Person, on_delete=models.SET_NULL, null=True, blank=True, related_name='enrollments')
    dynamic_data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    @property
    def full_name(self):
        # Intentamos buscar un campo que se llame 'Nombre' o 'Apellido' o similar dentro del JSON
        data = {k.lower(): v for k, v in self.dynamic_data.items()}
        
        # Prioridad de búsqueda de nombres
        first_name = data.get('nombre', data.get('nombres', ''))
        last_name = data.get('apellido', data.get('apellidos', ''))
        
        if first_name or last_name:
            return f"{first_name} {last_name}".strip()
        
        # Si no hay nombre/apellido, buscar DNI o similar
        dni = data.get('dni', data.get('documento', ''))
        if dni:
            return f"DNI {dni}"

        return f"Registro #{self.id}"

    def __str__(self):
        return f"Registro #{self.id} ({self.enrollment_list.name})"

class AsignacionCumpleanos(models.Model):
    persona = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='cumpleanos_asignados')
    empleado = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name="Empleado asignado")
    anio = models.IntegerField(verbose_name="Año del cumpleaños")
    entregado = models.BooleanField(default=False, verbose_name="¿Información entregada?")
    observacion = models.TextField(blank=True, null=True)
    observacion_resuelta = models.BooleanField(default=False, verbose_name="¿Observación resuelta?")

    class Meta:
        verbose_name = "Asignación de Cumpleaños"
        verbose_name_plural = "Asignaciones de Cumpleaños"
        constraints = [
            models.UniqueConstraint(fields=['persona', 'anio'], name='unico_cumpleanos_por_persona_y_anio')
        ]

    def __str__(self):
        return f"Revisión {self.persona} - Año {self.anio}"
