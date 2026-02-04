from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import CustomTokenObtainPairView, extend_session_view

urlpatterns = [
    # --- Rutas Administrativas ---
    path('admin/', admin.site.urls),

    # --- Autenticación (JWT) ---
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/extend-session/', extend_session_view, name='extend_session'),

    # --- Tus Apps ---
    path('api/surveys/', include('surveys.urls')),
]

# --- Configuración de Archivos Media (Imágenes) ---
# Esto maneja las imágenes tanto en desarrollo como si apagas el DEBUG temporalmente
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Fallback explícito para servir media si DEBUG es False y Nginx no lo está haciendo
if not settings.DEBUG:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {
            'document_root': settings.MEDIA_ROOT,
        }),
    ]