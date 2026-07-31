from rest_framework import viewsets
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """/api/audit-logs/ — read-only, org-scoped, filterable by action/resource_type."""
    serializer_class = AuditLogSerializer
    filterset_fields = ["action", "resource_type"]
    search_fields = ["description", "actor_email_snapshot"]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        return AuditLog.objects.filter(organization=self.request.user.organization)
