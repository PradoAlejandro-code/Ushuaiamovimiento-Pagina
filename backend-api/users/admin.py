from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from image_cropping import ImageCroppingMixin
from easy_thumbnails.files import get_thumbnailer
from .models import User

class CustomUserAdmin(ImageCroppingMixin, UserAdmin):
    model = User
    list_display = ['email', 'username', 'role', 'is_staff', 'circular_preview']
    list_filter = ['role', 'is_staff', 'is_superuser', 'groups']
    ordering = ['email']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Role Info', {'fields': ('role', 'profile_picture', 'cropping')}),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Role Info', {'fields': ('role', 'profile_picture')}),
    )

    def circular_preview(self, obj):
        if obj.profile_picture:
            try:
                # Use the manual crop coordinates for the preview
                thumbnail_options = {
                    'size': (50, 50),
                    'box': obj.cropping,
                    'crop': True,
                    'detail': True,
                }
                url = get_thumbnailer(obj.profile_picture).get_thumbnail(thumbnail_options).url
                return format_html('<img src="{}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 1px solid #ccc;" />', url)
            except Exception:
                # Fallback if cropping fails or image invalid
                return format_html('<img src="{}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" />', obj.profile_picture.url)
        return "-"
    circular_preview.short_description = 'Avatar'

admin.site.register(User, CustomUserAdmin)
