from django.contrib import admin
from .models import APIKey


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = ["name", "organization", "prefix", "is_active", "created_by"]
    list_filter = ["is_active", "organization"]
    search_fields = ["name", "prefix"]
