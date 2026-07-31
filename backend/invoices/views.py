from django.db import transaction
from rest_framework import permissions, viewsets

from audit.utils import log_action
from .filters import InvoiceFilter
from .models import Invoice, InvoiceLineItem
from .serializers import InvoiceDetailSerializer, InvoiceListSerializer


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    /api/invoices/ - org-scoped CRUD. Line items are nested and writable;
    every create/update replaces the full line-item set inside a
    transaction, then recalculates subtotal/tax/total server-side so the
    stored total can never drift from what the line items actually say.
    """
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "public_id"
    filterset_class = InvoiceFilter
    search_fields = ["invoice_number", "customer__name", "notes"]
    ordering_fields = ["due_date", "issue_date", "total", "created_at"]

    def get_queryset(self):
        return Invoice.objects.filter(
            organization=self.request.user.organization
        ).select_related("customer", "project").prefetch_related("line_items")

    def get_serializer_class(self):
        if self.action == "list":
            return InvoiceListSerializer
        return InvoiceDetailSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    @transaction.atomic
    def perform_create(self, serializer):
        line_items_data = serializer.validated_data.pop("line_items")
        invoice = serializer.save(
            organization=self.request.user.organization,
            invoice_number=Invoice.next_number(self.request.user.organization),
        )
        for i, item_data in enumerate(line_items_data):
            InvoiceLineItem.objects.create(invoice=invoice, position=i, **item_data)
        invoice.recalculate_totals()
        log_action("create", "invoice", invoice.public_id, f"Created invoice {invoice.invoice_number}")

    @transaction.atomic
    def perform_update(self, serializer):
        line_items_data = serializer.validated_data.pop("line_items", None)
        invoice = serializer.save()
        if line_items_data is not None:
            invoice.line_items.all().delete()
            for i, item_data in enumerate(line_items_data):
                InvoiceLineItem.objects.create(invoice=invoice, position=i, **item_data)
        invoice.recalculate_totals()
        log_action("update", "invoice", invoice.public_id, f"Updated invoice {invoice.invoice_number}")

    def perform_destroy(self, instance):
        log_action("delete", "invoice", instance.public_id, f"Deleted invoice {instance.invoice_number}")
        instance.delete()
