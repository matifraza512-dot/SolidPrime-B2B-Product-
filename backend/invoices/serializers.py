from rest_framework import serializers

from customers.models import Customer
from projects.models import Project
from .models import Invoice, InvoiceLineItem


class InvoiceLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceLineItem
        fields = ["id", "description", "quantity", "unit_price", "line_total", "position"]
        read_only_fields = ["id", "line_total"]


class InvoiceListSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "public_id", "invoice_number", "customer_name", "status",
            "status_display", "total", "issue_date", "due_date", "created_at",
        ]

    def get_customer_name(self, obj):
        return obj.customer.name


class InvoiceDetailSerializer(serializers.ModelSerializer):
    """
    line_items is writable here: POST/PATCH accepts a full list and the
    view replaces all existing rows with it (simplest correct approach for
    a document like an invoice - partial line-item PATCHes invite subtle
    bugs, e.g. "did the client mean to delete the row they omitted?").
    customer/project use SlugRelatedField on public_id, same convention as
    Deal and Project after that fix was established.
    """
    customer = serializers.SlugRelatedField(slug_field="public_id", queryset=Customer.objects.all())
    project = serializers.SlugRelatedField(
        slug_field="public_id", queryset=Project.objects.all(), required=False, allow_null=True
    )
    customer_name = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    line_items = InvoiceLineItemSerializer(many=True)

    class Meta:
        model = Invoice
        fields = [
            "public_id", "invoice_number", "customer", "customer_name",
            "project", "project_name", "status", "status_display",
            "issue_date", "due_date", "notes", "tax_rate",
            "subtotal", "tax_amount", "total", "line_items",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "public_id", "invoice_number", "subtotal", "tax_amount",
            "total", "created_at", "updated_at",
        ]

    def get_customer_name(self, obj):
        return obj.customer.name

    def get_project_name(self, obj):
        return obj.project.name if obj.project else None

    def validate_line_items(self, value):
        if not value:
            raise serializers.ValidationError("An invoice needs at least one line item.")
        return value

    def validate_customer(self, value):
        request = self.context["request"]
        if value.organization_id != request.user.organization_id:
            raise serializers.ValidationError("Customer must belong to your organization.")
        return value

    def validate_project(self, value):
        request = self.context["request"]
        if value and value.organization_id != request.user.organization_id:
            raise serializers.ValidationError("Project must belong to your organization.")
        return value
