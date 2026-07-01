# api_security/serializers.py

from rest_framework import serializers

from .models import EnterpriseAPI


class APISerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = EnterpriseAPI

        fields = "__all__"