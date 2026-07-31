from rest_framework import serializers
from .models import APIKey


class APIKeySerializer(serializers.ModelSerializer):
    # Deliberately excludes hashed_key entirely - even the field name never
    # appears in any API response, list or detail. raw_key is added
    # manually in the view, only on the create response, never here.
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = APIKey
        fields = [
            "public_id", "name", "prefix", "is_active",
            "created_by_name", "last_used_at", "created_at",
        ]
        read_only_fields = fields

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None


class APIKeyCreateInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
