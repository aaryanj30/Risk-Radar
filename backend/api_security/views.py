# api_security/views.py

from rest_framework.generics import ListAPIView

from .models import EnterpriseAPI

from .serializers import APISerializer


class APIListView(ListAPIView):

    queryset = EnterpriseAPI.objects.all()

    serializer_class = APISerializer