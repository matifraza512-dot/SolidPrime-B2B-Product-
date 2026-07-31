from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from audit.utils import log_action
from common.permissions import IsSameOrganization
from .models import Deal
from .serializers import DealSerializer


class DealViewSet(viewsets.ModelViewSet):
    """
    /api/deals/ - powers the Sales Pipeline Kanban board.
    Pagination is intentionally disabled: the board needs every deal at once
    to render its columns, unlike Customers' list view which is paginated.
    perform_update specifically detects stage changes (a card being dragged
    to a new column) and writes a distinct audit entry for it, so the audit
    log reads "Moved deal X to Won" instead of a generic "Updated deal X".
    """
    permission_classes = [IsAuthenticated, IsSameOrganization]
    lookup_field = "public_id"
    serializer_class = DealSerializer
    pagination_class = None
    filterset_fields = ["stage", "owner"]
    search_fields = ["title", "notes"]
    ordering_fields = ["created_at", "value"]

    def get_queryset(self):
        return Deal.objects.filter(
            organization=self.request.user.organization
        ).select_related("customer", "owner")

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def perform_create(self, serializer):
        instance = serializer.save(organization=self.request.user.organization)
        log_action("create", "deal", instance.public_id, f"Created deal '{instance.title}'")

    def perform_update(self, serializer):
        old_stage = serializer.instance.stage
        instance = serializer.save()
        if instance.stage != old_stage:
            log_action(
                "update", "deal", instance.public_id,
                f"Moved deal '{instance.title}' to {instance.get_stage_display()}",
            )
        else:
            log_action("update", "deal", instance.public_id, f"Updated deal '{instance.title}'")

    def perform_destroy(self, instance):
        log_action("delete", "deal", instance.public_id, f"Deleted deal '{instance.title}'")
        instance.delete()
