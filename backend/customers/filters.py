import django_filters
from .models import Customer


class CustomerFilter(django_filters.FilterSet):
    min_value = django_filters.NumberFilter(field_name="lifetime_value", lookup_expr="gte")
    max_value = django_filters.NumberFilter(field_name="lifetime_value", lookup_expr="lte")
    created_after = django_filters.DateFilter(field_name="created_at", lookup_expr="gte")
    created_before = django_filters.DateFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = Customer
        fields = ["status", "industry", "owner", "min_value", "max_value", "created_after", "created_before"]
