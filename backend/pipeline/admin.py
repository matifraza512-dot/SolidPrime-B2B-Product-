from django.contrib import admin
from .models import Deal


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = ["title", "organization", "stage", "value", "owner"]
    list_filter = ["stage", "organization"]
    search_fields = ["title"]
