from django.urls import path

from .views import (
    VendorListView,
    VendorDetailView,
    CyberNewsListView,
    VendorCyberNewsView
)

urlpatterns = [

    path('', VendorListView.as_view()),
    path('<str:vendor_name>/',VendorDetailView.as_view()),
    path("cyber-news/",CyberNewsListView.as_view()),
path("cyber-news/<str:vendor>/",VendorCyberNewsView.as_view()),
]