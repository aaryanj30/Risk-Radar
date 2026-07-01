# api_security/urls.py

from django.urls import path

from .views import APIListView

urlpatterns = [

    path(
        '',
        APIListView.as_view()
    ),
]