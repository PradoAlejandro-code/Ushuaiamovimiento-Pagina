from django.contrib import admin
from .models import EnrollmentList, ListField, Enrollee, Person, AsignacionCumpleanos

class ListFieldInline(admin.TabularInline):
    model = ListField
    extra = 1

@admin.register(EnrollmentList)
class EnrollmentListAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)
    inlines = [ListFieldInline]

@admin.register(Enrollee)
class EnrolleeAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'enrollment_list', 'created_at')
    list_filter = ('enrollment_list', 'created_at')
    search_fields = ('id', 'dynamic_data')
    
@admin.register(ListField)
class ListFieldAdmin(admin.ModelAdmin):
    list_display = ('name', 'enrollment_list')
    list_filter = ('enrollment_list',)
    search_fields = ('name',)

@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ('dni', 'last_name', 'first_name', 'city', 'is_affiliate', 'created_at')
    list_filter = ('city', 'is_affiliate', 'created_at')
    search_fields = ('dni', 'last_name', 'first_name', 'profession')
    ordering = ('-created_at',)

@admin.register(AsignacionCumpleanos)
class AsignacionCumpleanosAdmin(admin.ModelAdmin):
    list_display = ('persona', 'anio', 'empleado', 'entregado')
    list_filter = ('entregado', 'anio', 'empleado')
    search_fields = ('persona__first_name', 'persona__last_name', 'observacion')
    list_editable = ('entregado',)
