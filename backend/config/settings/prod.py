import environ
from .base import *  # noqa

env = environ.Env()

DEBUG = False

# Render terminates SSL at its edge and forwards plain HTTP internally with
# an X-Forwarded-Proto header - without this line, SECURE_SSL_REDIRECT below
# causes Django to think every request is insecure and redirect forever.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Serve static files directly from Django via whitenoise - no separate
# static file host needed for a Render/Railway single-service deploy.
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")
STORAGES = {
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=False)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=[
        "https://solid-prime-b2-b-product.vercel.app",
    ],
)
CORS_ALLOW_CREDENTIALS = True

ALLOWED_HOSTS = env.list(
    "ALLOWED_HOSTS",
    default=["matifraza512.pythonanywhere.com"],
)
