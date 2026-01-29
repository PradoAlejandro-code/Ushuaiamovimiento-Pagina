from django_hosts import patterns, host
from django.conf import settings

host_patterns = patterns('',
    # 1. API: Para cuando tu React llame al backend (api.tuweb.com)
    host(r'api', settings.ROOT_URLCONF, name='api'),

    # 2. ADMIN: Para entrar al panel (admin.tuweb.com)
    host(r'admin', settings.ROOT_URLCONF, name='admin'),

    # 3. LOCALHOST / WWW: Esta es la clave para que te ande AHORA.
    # Si estás en localhost:8000 o www.tuweb.com, entra aquí.
    host(r'www', settings.ROOT_URLCONF, name='www'), 
    host(r'localhost', settings.ROOT_URLCONF, name='localhost'),

    # 4. SECTORES: El comodín para el futuro (jefe., deposito., etc.)
    # Ahora que creaste el archivo en el Paso 1, esta línea ya no dará error.
    host(r'(?P<sector>\w+)', 'users.urls_sectores', name='sector-wildcard'),
)