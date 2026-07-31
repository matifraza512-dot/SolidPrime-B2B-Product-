from django.contrib import admin
from .models import Invoice, InvoiceLineItem


class InvoiceLineItemInline(admin.TabularInline):
    model = InvoiceLineItem
    extra = 0


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ["invoice_number", "organization", "customer", "status", "total", "due_date"]
    list_filter = ["status", "organization"]
    search_fields = ["invoice_number"]
    inlines = [InvoiceLineItemInline]
