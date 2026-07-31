from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from audit.utils import log_action
from common.permissions import IsAdmin, IsSameOrganization
from .models import APIKey
from .serializers import APIKeyCreateInputSerializer, APIKeySerializer


class APIKeyViewSet(viewsets.GenericViewSet):
    """
    /api/api-keys/ - admin-only. Only list/create/revoke are exposed
    (no update, no hard delete) so every key's lifecycle stays auditable.
    """
    permission_classes = [IsAuthenticated, IsAdmin, IsSameOrganization]
    serializer_class = APIKeySerializer
    lookup_field = "public_id"

    def get_queryset(self):
        return APIKey.objects.filter(
            organization=self.request.user.organization
        ).select_related("created_by").order_by("-created_at")

    def list(self, request):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    def create(self, request):
        input_serializer = APIKeyCreateInputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        raw_key, prefix, hashed = APIKey.generate_key()
        instance = APIKey.objects.create(
            organization=request.user.organization,
            name=input_serializer.validated_data["name"],
            prefix=prefix,
            hashed_key=hashed,
            created_by=request.user,
        )
        log_action("create", "api_key", instance.public_id, f"Created API key '{instance.name}'")

        data = APIKeySerializer(instance).data
        data["raw_key"] = raw_key
        return Response(data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def revoke(self, request, public_id=None):
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        log_action("update", "api_key", instance.public_id, f"Revoked API key '{instance.name}'")
        return Response(APIKeySerializer(instance).data)
