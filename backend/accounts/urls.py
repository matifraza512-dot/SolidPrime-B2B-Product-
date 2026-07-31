from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ChangePasswordView,
    LoginView,
    MeView,
    NotificationPreferenceView,
    OrganizationDetailView,
    RegisterView,
    TeamMemberOptionsView,
    TeamMemberViewSet,
)

router = DefaultRouter()
router.register("team", TeamMemberViewSet, basename="team")

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("organizations/current/", OrganizationDetailView.as_view(), name="organization_current"),
    path("notification-preferences/", NotificationPreferenceView.as_view(), name="notification_preferences"),
    path("team/options/", TeamMemberOptionsView.as_view(), name="team_options"),
] + router.urls
