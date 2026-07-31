from rest_framework import permissions, viewsets

from audit.utils import log_action
from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    """
    /api/tasks/ - powers the Tasks Kanban board. Pagination is disabled,
    same reasoning as DealViewSet: the board needs every task at once to
    render its columns. perform_update detects status changes specifically
    so the audit log reads "Moved task X to Done" instead of a generic
    "Updated task X".
    """
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "public_id"
    serializer_class = TaskSerializer
    pagination_class = None
    filterset_fields = ["status", "priority", "project", "assignee"]
    search_fields = ["title", "description"]
    ordering_fields = ["due_date", "created_at", "priority"]

    def get_queryset(self):
        return Task.objects.filter(
            organization=self.request.user.organization
        ).select_related("project", "assignee")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        instance = serializer.save(organization=self.request.user.organization)
        log_action("create", "task", instance.public_id, f"Created task '{instance.title}'")

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        instance = serializer.save()
        if instance.status != old_status:
            log_action(
                "update", "task", instance.public_id,
                f"Moved task '{instance.title}' to {instance.get_status_display()}",
            )
        else:
            log_action("update", "task", instance.public_id, f"Updated task '{instance.title}'")

    def perform_destroy(self, instance):
        log_action("delete", "task", instance.public_id, f"Deleted task '{instance.title}'")
        instance.delete()
