from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "public_id", "actor_name", "actor_email_snapshot", "action",
            "resource_type", "resource_id", "description", "metadata", "created_at",
        ]
        read_only_fields = fields

    def get_actor_name(self, obj):
        return obj.actor.get_full_name() if obj.actor else obj.actor_email_snapshot
