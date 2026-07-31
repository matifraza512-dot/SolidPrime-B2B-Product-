from django.urls import path
from .views import KPISummaryView, RecentActivityView

urlpatterns = [
    path("kpis/", KPISummaryView.as_view(), name="dashboard-kpis"),
    path("activity/", RecentActivityView.as_view(), name="dashboard-activity"),
]
