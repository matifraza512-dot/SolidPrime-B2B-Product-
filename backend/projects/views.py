from rest_framework import permissions, viewsets

from .filters import ProjectFilter
from .models import Project
from .serializers import ProjectDetailSerializer, ProjectListSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    """
    /api/projects/ - org-scoped CRUD. lookup_field is explicitly public_id
    (not the default pk) - this is the exact bug the original Customer
    module shipped with and the DeepSeek Projects stub reintroduced, so it
    gets called out here deliberately rather than left implicit.
    """
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "public_id"
    filterset_class = ProjectFilter
    search_fields = ["name", "description", "customer__name"]
    ordering_fields = ["due_date", "budget", "created_at", "name"]

    def get_queryset(self):
        return Project.objects.filter(
            organization=self.request.user.organization
        ).select_related("customer", "owner")

    def get_serializer_class(self):
        if self.action == "list":
            return ProjectListSerializer
        return ProjectDetailSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)
