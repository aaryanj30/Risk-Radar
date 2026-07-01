from django.db.models import Avg
from rest_framework.views import APIView
from rest_framework.response import Response

from vendors.models import Vendor


class DashboardView(APIView):

    def get(self, request):

        critical = Vendor.objects.filter(
            risk_level="Critical"
        ).count()

        high = Vendor.objects.filter(
            risk_level="High"
        ).count()

        return Response({

            "enterprise_score":
                round(
                    Vendor.objects.all()
                    .aggregate(avg=Avg("risk_score"))
                    ["avg"],
                    2
                ),

            "total_vendors":
                Vendor.objects.count(),

            "critical_vendors":
                critical,

            "high_vendors":
                high
        })