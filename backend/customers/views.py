from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from audit.utils import log_action
from common.permissions import IsSameOrganization
from .filters import CustomerFilter
from .models import Customer
from .serializers import CustomerDetailSerializer, CustomerListSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for Customers, org-scoped and audit-logged.
    This viewset is the reference pattern for Projects/Invoices/Tasks -
    same shape: get_queryset scopes by org, get_serializer_class splits
    list/detail, perform_create/update/destroy write audit entries.
    IsAuthenticated gates list-level access; IsSameOrganization guards
    object-level access (retrieve/update/delete of a specific row).
    """
    permission_classes = [IsAuthenticated, IsSameOrganization]
    lookup_field = "public_id"
    filterset_class = CustomerFilter
    search_fields = ["name", "company", "email", "industry"]
    ordering_fields = ["name", "created_at", "lifetime_value"]

    def get_queryset(self):
        return Customer.objects.filter(
            organization=self.request.user.organization
        ).select_related("owner")

    def get_serializer_class(self):
        return CustomerListSerializer if self.action == "list" else CustomerDetailSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def perform_create(self, serializer):
        instance = serializer.save(organization=self.request.user.organization)
        log_action("create", "customer", instance.public_id, f"Created customer {instance.name}")

    def perform_update(self, serializer):
        instance = serializer.save()
        log_action("update", "customer", instance.public_id, f"Updated customer {instance.name}")

    def perform_destroy(self, instance):
        log_action("delete", "customer", instance.public_id, f"Deleted customer {instance.name}")
        instance.delete()
