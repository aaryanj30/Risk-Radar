from rest_framework import serializers
from .models import Vendor
from .models import CyberNews

class VendorSerializer(serializers.ModelSerializer):

    class Meta:
        model = Vendor
        fields = "__all__"


class CyberNewsSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = CyberNews

        fields = "__all__"