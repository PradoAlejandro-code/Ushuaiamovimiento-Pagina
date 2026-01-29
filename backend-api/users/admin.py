from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ['email', 'username', 'role', 'is_staff', 'is_superuser']
    list_filter = ['role', 'is_staff', 'is_superuser', 'groups']
    ordering = ['email']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Role Info', {'fields': ('role', 'profile_picture')}),
    )
    

    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Role Info', {'fields': ('role', 'profile_picture')}),
    )

admin.site.register(User, CustomUserAdmin)
