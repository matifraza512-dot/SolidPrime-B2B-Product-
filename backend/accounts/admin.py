from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Organization, User


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "created_at"]
    search_fields = ["name", "slug"]


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["email", "role", "organization", "is_active_member", "is_staff"]
    list_filter = ["role", "organization", "is_active_member"]
    search_fields = ["email", "first_name", "last_name"]
    ordering = ["email"]
    fieldsets = BaseUserAdmin.fieldsets + (
        ("BizOps", {"fields": ("organization", "role", "avatar", "phone", "job_title", "is_active_member")}),
    )
