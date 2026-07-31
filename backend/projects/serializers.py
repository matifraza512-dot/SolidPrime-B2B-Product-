from rest_framework import serializers
from accounts.models import User
from customers.models import Customer
from .models import Project


class ProjectListSerializer(serializers.ModelSerializer):
    """Lean serializer for the list/board view - same list/detail split as Customer."""
    customer_name = serializers.SerializerMethodField()
    owner_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Project
        fields = [
            "public_id", "name", "customer_name", "owner_name", "status",
            "status_display", "budget", "due_date", "created_at",
        ]

    def get_customer_name(self, obj):
        return obj.customer.name if obj.customer else None

    def get_owner_name(self, obj):
        return obj.owner.get_full_name() if obj.owner else None


class ProjectDetailSerializer(serializers.ModelSerializer):
    # SlugRelatedField on public_id, not the default PrimaryKeyRelatedField -
    # same fix applied to Deal after the Pipeline module caught this bug.
    customer = serializers.SlugRelatedField(
        slug_field="public_id", queryset=Customer.objects.all(), required=False, allow_null=True
    )
    owner = serializers.SlugRelatedField(
        slug_field="public_id", queryset=User.objects.all(), required=False, allow_null=True
    )
    customer_name = serializers.SerializerMethodField()
    owner_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Project
        fields = [
            "public_id", "name", "description", "customer", "customer_name",
            "owner", "owner_name", "status", "status_display", "budget",
            "start_date", "due_date", "created_at", "updated_at",
        ]
        read_only_fields = ["public_id", "created_at", "updated_at"]

    def get_customer_name(self, obj):
        return obj.customer.name if obj.customer else None

    def get_owner_name(self, obj):
        return obj.owner.get_full_name() if obj.owner else None

    def validate_customer(self, value):
        request = self.context["request"]
        if value and value.organization_id != request.user.organization_id:
            raise serializers.ValidationError("Customer must belong to your organization.")
        return value

    def validate_owner(self, value):
        request = self.context["request"]
        if value and value.organization_id != request.user.organization_id:
            raise serializers.ValidationError("Owner must belong to your organization.")
        return value
