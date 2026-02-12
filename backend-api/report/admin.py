from django.contrib import admin
from .models import Informe

@admin.register(Informe)
class InformeAdmin(admin.ModelAdmin):
    list_display = ('id', 'titulo', 'creado_por', 'fecha_creacion')
    list_filter = ('fecha_creacion', 'seccion')
    search_fields = ('titulo', 'cuerpo')
