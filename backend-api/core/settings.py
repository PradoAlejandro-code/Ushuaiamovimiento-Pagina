from pathlib import Path
from datetime import timedelta
import os

BASE_DIR = Path(__file__).resolve().parent.parent


SECRET_KEY = 'django-insecure-bj-20b3a0u@vseyd6(otyh4+fuf#=o3b67z^wa1i!-+qw0r3pa'

DEBUG = True

ALLOWED_HOSTS = [
    'api.ushuaiamovimiento.com.ar', 
    'localhost', 
]
CSRF_TRUSTED_ORIGINS = ['https://api.ushuaiamovimiento.com.ar']

# SSL Rewrite Settings
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True

CORS_ALLOW_ALL_ORIGINS = True # Development only

CORS_ALLOWED_ORIGINS = [
    "https://api.ushuaiamovimiento.com.ar",
    "https://ushuaiamovimiento.com.ar",
    "http://localhost:5173",
    "http://localhost:5174",
]

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://\w+\.ushuaiamovimiento\.com\.ar$",
    r"^http://localhost:\d+$",
]

# Application definition

INSTALLED_APPS = [
    'django_hosts',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    # Local
    'users',
    'surveys',
    'report',
    'contact',
    'export',
    'enrollments',
    'imports',
    'django_cleanup.apps.CleanupConfig',
    'easy_thumbnails',
    'image_cropping',
    'import_export',
]

MIDDLEWARE = [
    'django_hosts.middleware.HostsRequestMiddleware',
    'django.middleware.security.SecurityMiddleware',
    "whitenoise.middleware.WhiteNoiseMiddleware",
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', 
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django_hosts.middleware.HostsResponseMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'ushuaiadb',
        'USER': 'ushuaiauser',
        'PASSWORD': 'Mopof54', 
        'HOST': 'base-datos',                 
        'PORT': '5432', 
    }
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'America/Argentina/Buenos_Aires'
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / "staticfiles"

# --- CAMBIO AQUÍ: Carpeta para archivos estáticos globales ---
STATICFILES_DIRS = [
    BASE_DIR / "static",
]

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),  
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}

# FILE UPLOAD SETTINGS
DATA_UPLOAD_MAX_MEMORY_SIZE = 209715200 
FILE_UPLOAD_MAX_MEMORY_SIZE = 209715200  
DATA_UPLOAD_MAX_NUMBER_FIELDS = 200000

# SLIDING SESSION CONFIGURATION
SESSION_COOKIE_AGE = 3600 
SESSION_SAVE_EVERY_REQUEST = True
SESSION_COOKIE_DOMAIN = ".ushuaiamovimiento.com.ar"
SESSION_COOKIE_NAME = "sessionid" 

# Media Config
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

ROOT_HOSTCONF = 'core.hosts' 
DEFAULT_HOST = 'api'