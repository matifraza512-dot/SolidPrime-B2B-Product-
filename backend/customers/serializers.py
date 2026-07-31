from rest_framework import serializers

from .models import Customer


class CustomerListSerializer(serializers.ModelSerializer):
    """
    Lean serializer for table/list views. Splitting list vs detail serializers
    is a deliberate perf decision: list endpoints get hit constantly (search-as-you-type,
    pagination), so we avoid serializing `notes` (can be large text) on every row.
    """
    owner_name = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            "public_id", "name", "company", "email", "status", "industry",
            "lifetime_value", "owner_name", "created_at",
        ]

    def get_owner_name(self, obj):
        return obj.owner.get_full_name() if obj.owner else None


class CustomerDetailSerializer(serializers.ModelSerializer):
    owner_name = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            "public_id", "name", "company", "email", "phone", "status",
            "industry", "lifetime_value", "notes", "logo", "owner", "owner_name",
            "created_at", "updated_at",
        ]
        read_only_fields = ["public_id", "created_at", "updated_at"]

    def get_owner_name(self, obj):
        return obj.owner.get_full_name() if obj.owner else None

    def validate_owner(self, value):
        request = self.context["request"]
        if value and value.organization_id != request.user.organization_id:
            raise serializers.ValidationError("Owner must belong to your organization.")
        return value

    def validate_email(self, value):
        request = self.context["request"]
        qs = Customer.objects.filter(organization=request.user.organization, email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A customer with this email already exists in your organization.")
        return value
