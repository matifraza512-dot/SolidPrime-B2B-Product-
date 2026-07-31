from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from customers.models import Customer
from pipeline.models import Deal

RESULT_LIMIT = 5


class GlobalSearchView(APIView):
    """
    GET /api/search/?q=... - lightweight cross-module search that powers the
    Cmd+K palette. No new models: it queries the same org-scoped tables the
    Customers/Pipeline/Team pages already use, just aggregated and capped.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if len(query) < 2:
            return Response({"customers": [], "deals": [], "team": []})

        org = request.user.organization

        customers = Customer.objects.filter(organization=org).filter(
            Q(name__icontains=query) | Q(company__icontains=query) | Q(email__icontains=query)
        )[:RESULT_LIMIT]

        deals = Deal.objects.filter(organization=org).filter(
            Q(title__icontains=query) | Q(customer__name__icontains=query)
        ).select_related("customer")[:RESULT_LIMIT]

        team_results = []
        if request.user.role == User.Role.ADMIN:
            team_qs = User.objects.filter(organization=org).filter(
                Q(first_name__icontains=query) | Q(last_name__icontains=query) | Q(email__icontains=query)
            )[:RESULT_LIMIT]
            team_results = [
                {
                    "public_id": str(member.public_id),
                    "label": member.get_full_name() or member.email,
                    "sublabel": member.email,
                }
                for member in team_qs
            ]

        return Response({
            "customers": [
                {
                    "public_id": str(c.public_id),
                    "label": c.name,
                    "sublabel": c.company or c.email,
                }
                for c in customers
            ],
            "deals": [
                {
                    "public_id": str(d.public_id),
                    "label": d.title,
                    "sublabel": d.customer.name if d.customer else d.get_stage_display(),
                }
                for d in deals
            ],
            "team": team_results,
        })
