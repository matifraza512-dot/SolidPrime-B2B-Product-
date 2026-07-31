from rest_framework import serializers

from accounts.models import User
from projects.models import Project
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    project = serializers.SlugRelatedField(
        slug_field="public_id", queryset=Project.objects.all(), required=False, allow_null=True
    )
    assignee = serializers.SlugRelatedField(
        slug_field="public_id", queryset=User.objects.all(), required=False, allow_null=True
    )
    project_name = serializers.SerializerMethodField()
    assignee_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)

    class Meta:
        model = Task
        fields = [
            "public_id", "title", "description", "project", "project_name",
            "assignee", "assignee_name", "status", "status_display",
            "priority", "priority_display", "due_date",
            "created_at", "updated_at",
        ]
        read_only_fields = ["public_id", "created_at", "updated_at"]

    def get_project_name(self, obj):
        return obj.project.name if obj.project else None

    def get_assignee_name(self, obj):
        return obj.assignee.get_full_name() if obj.assignee else None

    def validate_project(self, value):
        request = self.context["request"]
        if value and value.organization_id != request.user.organization_id:
            raise serializers.ValidationError("Project must belong to your organization.")
        return value

    def validate_assignee(self, value):
        request = self.context["request"]
        if value and value.organization_id != request.user.organization_id:
            raise serializers.ValidationError("Assignee must belong to your organization.")
        return value
