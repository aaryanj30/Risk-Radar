from django.db import models


class Vendor(models.Model):

    name = models.CharField(max_length=255)

    cybersecurity = models.FloatField(default=0)

    financial = models.FloatField(default=0)

    compliance = models.FloatField(default=0)

    operational = models.FloatField(default=0)

    risk_events_count = models.IntegerField(default=0)

    risk_score = models.FloatField(default=0)

    risk_level = models.CharField(
        max_length=50,
        default="Low"
    )

    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class VendorNews(models.Model):

    vendor = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    title = models.TextField(
        null=True,
        blank=True
    )

    link = models.URLField(
        max_length=1000,
        null=True,
        blank=True
    )

    published = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    text = models.TextField(
        null=True,
        blank=True
    )

    risk_category = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    category = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    severity = models.CharField(
        max_length=50,
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.vendor} - {self.title[:50] if self.title else 'No Title'}"



class CyberNews(models.Model):

    vendor = models.CharField(max_length=255)

    title = models.TextField()

    published = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    risk_category = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    cyber_hits = models.IntegerField(
        default=0
    )

    financial_hits = models.IntegerField(
        default=0
    )

    compliance_hits = models.IntegerField(
        default=0
    )

    operational_hits = models.IntegerField(
        default=0
    )