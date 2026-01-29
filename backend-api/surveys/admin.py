from django.contrib import admin
from .models import Encuesta, Pregunta, RespuestaHeader, RespuestaDetalle, Seccion, Barrio

class PreguntaInline(admin.TabularInline):
    model = Pregunta
    extra = 1

@admin.register(Encuesta)
class EncuestaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'fecha_creacion', 'activo', 'es_relevamiento')
    inlines = [PreguntaInline]

@admin.register(RespuestaHeader)
class RespuestaHeaderAdmin(admin.ModelAdmin):
    list_display = ('encuesta', 'usuario', 'fecha_envio', 'seccion', 'barrio')

class BarrioInline(admin.TabularInline):
    model = Barrio
    extra = 1

@admin.register(Seccion)
class SeccionAdmin(admin.ModelAdmin):
    inlines = [BarrioInline]
    search_fields = ['nombre']

@admin.register(Barrio)
class BarrioAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'seccion')
    list_filter = ('seccion',)
    search_fields = ('nombre',)
