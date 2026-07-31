from django.urls import path

from .search_views import GlobalSearchView

urlpatterns = [
    path("search/", GlobalSearchView.as_view(), name="global-search"),
]
