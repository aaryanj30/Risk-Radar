from django.db import models

class Alert(models.Model):
    vendor = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    title = models.CharField(max_length=255)

    severity = models.CharField(max_length=50)

    category = models.CharField(max_length=100)

    created_at = models.DateTimeField(auto_now_add=True)

    resolved = models.BooleanField(default=False)