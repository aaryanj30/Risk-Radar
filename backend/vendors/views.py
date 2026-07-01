from rest_framework.response import Response
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView

from .models import Vendor
from .serializers import VendorSerializer

from .models import CyberNews

from .serializers import (
    CyberNewsSerializer
)

class VendorListView(ListAPIView):

    serializer_class = VendorSerializer

    def get_queryset(self):

        return Vendor.objects.all().order_by(
            "-risk_score"
        )

class VendorDetailView(APIView):

    def get(self, request, vendor_name):

        vendor = Vendor.objects.get(
            name=vendor_name
        )
        return Response({

            "name": vendor.name,

            "risk_score": vendor.risk_score,

            "risk_level": vendor.risk_level,

            "cybersecurity": vendor.cybersecurity,

            "financial": vendor.financial,

            "compliance": vendor.compliance,

            "operational": vendor.operational,

            "risk_events_count":
                vendor.risk_events_count
        })

class CyberNewsListView(
    ListAPIView
):

    queryset = (
        CyberNews.objects.all()
        .order_by("-id")
    )

    serializer_class = (
        CyberNewsSerializer
    )

class VendorCyberNewsView(
    ListAPIView
):

    serializer_class = (
        CyberNewsSerializer
    )

    def get_queryset(self):

        vendor = self.kwargs[
            "vendor"
        ]

        return (
            CyberNews.objects
            .filter(vendor=vendor)
            .order_by("-id")
        )