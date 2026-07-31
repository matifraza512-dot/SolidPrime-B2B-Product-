from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from audit.models import AuditLog
from audit.serializers import AuditLogSerializer
from customers.models import Customer


class KPISummaryView(APIView):
    """
    GET /api/dashboard/kpis/ — powers the KPI cards on the dashboard home page.
    Deliberately aggregated server-side (not computed client-side from a full
    customer list) so the payload stays tiny and the query stays index-backed
    as data grows into the millions of rows.

    NOTE: Revenue/Projects/API-requests/Team-productivity figures reference
    models from the Projects/Invoices modules (next build phase) — wired here
    with safe fallbacks so this endpoint is usable today and requires zero
    changes when those modules land.
    """

    def get(self, request):
        org = request.user.organization
        customers_qs = Customer.objects.filter(organization=org)

        total_customers = customers_qs.count()
        active_customers = customers_qs.filter(status="active").count()
        total_revenue = customers_qs.aggregate(total=Sum("lifetime_value"))["total"] or 0
        new_this_month = customers_qs.filter(
            created_at__year=timezone.now().year, created_at__month=timezone.now().month
        ).count()

        by_status = list(customers_qs.values("status").annotate(count=Count("id")))

        return Response({
            "revenue": {"value": float(total_revenue), "label": "Total Revenue"},
            "customers": {"value": total_customers, "active": active_customers, "new_this_month": new_this_month},
            "active_projects": {"value": 0, "label": "Active Projects", "note": "Projects module pending"},
            "api_requests": {"value": 0, "label": "API Requests (30d)", "note": "Integrations module pending"},
            "team_productivity": {"value": None, "label": "Team Productivity", "note": "Tasks module pending"},
            "customers_by_status": by_status,
        })


class RecentActivityView(APIView):
    """GET /api/dashboard/activity/ — feeds the 'Recent Activity' panel from the audit trail."""

    def get(self, request):
        logs = AuditLog.objects.filter(organization=request.user.organization)[:15]
        return Response(AuditLogSerializer(logs, many=True).data)
