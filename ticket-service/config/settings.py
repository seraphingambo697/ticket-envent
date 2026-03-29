import os, dj_database_url

SECRET_KEY   = os.environ.get('SECRET_KEY', 'dev-secret')
DEBUG        = os.environ.get('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'corsheaders',
    'rest_framework',
    
    'drf_spectacular',
    'ticketapp',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
]

# ── TEMPLATES — requis par drf_spectacular pour le Swagger UI ────────────
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
            ],
        },
    },
]

ROOT_URLCONF       = 'config.urls'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL', 'sqlite:///tickets.db'),
        conn_max_age=600,
    )
}

AUTH_SERVICE_URL  = os.environ.get('AUTH_SERVICE_URL',  'http://auth-service:8000')
EVENT_SERVICE_URL = os.environ.get('EVENT_SERVICE_URL', 'http://event-service:8000')
RABBITMQ_URL      = os.environ.get('RABBITMQ_URL',      'amqp://guest:guest@rabbitmq:5672/')

# ── CORS — autorise le frontend React en dev ─────────────────────────────
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',   # Vite dev server
    'http://localhost:80',     # Nginx frontend prod
    'http://127.0.0.1:5173',
]
CORS_ALLOW_CREDENTIALS = True
CORS_URLS_REGEX = r'^/api/.*$'

CORS_ALLOW_HEADERS = [
    'accept',
    'authorization',
    'content-type',
    'x-request-id',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ['ticketapp.auth.RemoteJWTAuth'],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SIMPLE_JWT = {'AUTH_HEADER_TYPES': ('Bearer',)}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Ticket Service API',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {'format': '[%(asctime)s] [%(levelname)s] [ticket-service] %(message)s'},
    },
    'handlers': {'console': {'class': 'logging.StreamHandler', 'formatter': 'verbose'}},
    'loggers': {
        'ticketapp': {'handlers': ['console'], 'level': 'DEBUG', 'propagate': False},
        'django': {'handlers': ['console'], 'level': 'WARNING'},
    },
}
USE_TZ = True
