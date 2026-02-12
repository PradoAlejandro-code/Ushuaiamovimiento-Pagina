from django.contrib import admin
from .models import Contacto

@admin.register(Contacto)
class ContactoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'celular', 'email', 'tag', 'ultima_actualizacion')
    search_fields = ('nombre', 'celular', 'dni')
    list_filter = ('tag', 'ultima_actualizacion')
