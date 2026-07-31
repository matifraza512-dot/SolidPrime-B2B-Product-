from rest_framework import serializers
from customers.models import Customer
from accounts.models import User
from .models import Deal


class DealSerializer(serializers.ModelSerializer):
    # SlugRelatedField (keyed on public_id) instead of the default
    # PrimaryKeyRelatedField - every other public-facing ID in this API is a
    # UUID public_id, never the internal integer pk, so relations need to
    # match that convention or the frontend has no valid value to send/receive.
    customer = serializers.SlugRelatedField(
        slug_field="public_id", queryset=Customer.objects.all(), required=False, allow_null=True
    )
    owner = serializers.SlugRelatedField(
        slug_field="public_id", queryset=User.objects.all(), required=False, allow_null=True
    )
    customer_name = serializers.SerializerMethodField()
    owner_name = serializers.SerializerMethodField()
    stage_display = serializers.CharField(source="get_stage_display", read_only=True)

    class Meta:
        model = Deal
        fields = [
            "public_id", "title", "customer", "customer_name", "value", "stage",
            "stage_display", "owner", "owner_name", "expected_close_date", "notes",
            "created_at", "updated_at",
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
