# api_security/models.py

from django.db import models


class EnterpriseAPI(models.Model):

    name = models.CharField(max_length=255)

    endpoint = models.CharField(max_length=500)

    auth = models.BooleanField(default=False)

    tls = models.BooleanField(default=False)

    rate_limit = models.BooleanField(default=False)

    status = models.CharField(max_length=50)

    owner = models.CharField(max_length=255)

    last_used = models.DateField()

    risk_score = models.FloatField(default=0)

    vendor = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.name