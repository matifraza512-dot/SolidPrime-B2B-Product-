import django_filters

from .models import Invoice


class InvoiceFilter(django_filters.FilterSet):
    due_before = django_filters.DateFilter(field_name="due_date", lookup_expr="lte")
    due_after = django_filters.DateFilter(field_name="due_date", lookup_expr="gte")

    class Meta:
        model = Invoice
        fields = ["status", "customer", "project"]
