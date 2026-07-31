from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ["title", "organization", "status", "priority", "project", "assignee", "due_date"]
    list_filter = ["status", "priority", "organization"]
    search_fields = ["title", "description"]
