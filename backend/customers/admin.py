from django.contrib import admin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ["name", "organization", "status", "lifetime_value", "owner"]
    list_filter = ["status", "organization"]
    search_fields = ["name", "email", "company"]
