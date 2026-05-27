from django.urls import path
from api.views import SearchView

urlpatterns = [
    path('search/', SearchView.as_view(), name='search'),
]
