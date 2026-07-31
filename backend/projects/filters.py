import django_filters

from .models import Project


class ProjectFilter(django_filters.FilterSet):
    """Beyond simple exact-match fields, supports a due-date range so the
    frontend can build "due this week" / "overdue" quick filters later."""
    due_before = django_filters.DateFilter(field_name="due_date", lookup_expr="lte")
    due_after = django_filters.DateFilter(field_name="due_date", lookup_expr="gte")

    class Meta:
        model = Project
        fields = ["status", "customer", "owner"]
