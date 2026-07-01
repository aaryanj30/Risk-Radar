from rest_framework.generics import ListAPIView

from .models import Alert
from .serializers import AlertSerializer


class VendorAlertView(ListAPIView):

    serializer_class = AlertSerializer

    def get_queryset(self):

        vendor = self.kwargs["vendor"]

        return Alert.objects.filter(
            vendor=vendor
        )