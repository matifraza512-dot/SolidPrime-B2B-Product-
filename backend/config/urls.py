from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/", include("customers.urls")),
    path("api/", include("audit.urls")),
    path("api/", include("pipeline.urls")),
    path("api/", include("projects.urls")),
    path("api/", include("invoices.urls")),
    path("api/", include("tasks.urls")),
    path("api/", include("notifications.urls")),
    path("api/", include("integrations.urls")),
    path("api/dashboard/", include("dashboard.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
