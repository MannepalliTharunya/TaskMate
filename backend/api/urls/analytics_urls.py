from django.urls import path
from api.views import AnalyticsView

urlpatterns = [
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
]
