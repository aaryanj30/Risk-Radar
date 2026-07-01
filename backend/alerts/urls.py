from django.urls import path

from .views import VendorAlertView

urlpatterns = [

    path(
        "<str:vendor>/",
        VendorAlertView.as_view()
    )
]