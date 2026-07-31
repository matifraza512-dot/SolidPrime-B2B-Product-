from rest_framework import generics, permissions, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from common.permissions import IsAdmin
from .models import NotificationPreference, Organization, User
from .serializers import (
    BizOpsTokenObtainPairSerializer,
    ChangePasswordSerializer,
    NotificationPreferenceSerializer,
    OrganizationSerializer,
    OrganizationUpdateSerializer,
    RegisterSerializer,
    TeamMemberSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ - creates Organization + first Admin user."""
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer
    throttle_scope = "auth"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token_serializer = BizOpsTokenObtainPairSerializer()
        token = token_serializer.get_token(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(token.access_token),
                "refresh": str(token),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ - returns access + refresh + embedded user profile."""
    serializer_class = BizOpsTokenObtainPairSerializer
    throttle_scope = "auth"


class MeView(APIView):
    """GET/PATCH /api/auth/me/ - the authenticated user's own profile."""

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class TeamMemberOptionsView(APIView):
    """GET /api/team/options/ - lightweight, any authenticated user (not
    admin-only like TeamMemberViewSet) so assignee dropdowns work for
    everyone, e.g. the Tasks module's assignee picker."""

    def get(self, request):
        members = User.objects.filter(
            organization=request.user.organization, is_active_member=True
        )
        data = [
            {"public_id": str(m.public_id), "full_name": m.get_full_name() or m.email.split("@")[0]}
            for m in members
        ]
        return Response(data)


class TeamMemberViewSet(viewsets.ModelViewSet):
    """
    /api/team/ - Admin-only management of organization members (role changes,
    deactivation). Regular members are listed read-only elsewhere (e.g. task
    assignee dropdowns) via a separate lightweight endpoint if needed later.
    """
    serializer_class = TeamMemberSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ["role", "is_active_member"]
    search_fields = ["email", "first_name", "last_name"]
    ordering_fields = ["date_joined", "email"]

    def get_queryset(self):
        return User.objects.filter(organization=self.request.user.organization).exclude(
            id=self.request.user.id
        )


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/ - requires the current password."""

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not request.user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"old_password": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        return Response({"detail": "Password updated successfully."})


class OrganizationDetailView(APIView):
    """GET/PATCH /api/organizations/current/ - any member can view, only admins can rename."""

    def get_permissions(self):
        if self.request.method == "PATCH":
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def get(self, request):
        return Response(OrganizationSerializer(request.user.organization).data)

    def patch(self, request):
        org = request.user.organization
        serializer = OrganizationUpdateSerializer(org, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(OrganizationSerializer(org).data)


class NotificationPreferenceView(APIView):
    """GET/PATCH /api/notification-preferences/ - row is created lazily on first access."""

    def get_object(self, request):
        prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)
        return prefs

    def get(self, request):
        return Response(NotificationPreferenceSerializer(self.get_object(request)).data)

    def patch(self, request):
        prefs = self.get_object(request)
        serializer = NotificationPreferenceSerializer(prefs, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
