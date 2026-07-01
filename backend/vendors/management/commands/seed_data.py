import random

from django.core.management.base import BaseCommand

from vendors.models import Vendor


class Command(BaseCommand):

    def handle(self, *args, **kwargs):

        Vendor.objects.all().delete()

        companies = [

            "Okta",

            "Cloudflare",

            "Stripe",

            "Databricks",

            "Snowflake",

            "Twilio",

            "MongoDB",

            "NVIDIA"
        ]

        for company in companies:

            Vendor.objects.create(

                name=company,

                country="USA",

                industry="Technology",

                financial_score=random.randint(40,100),

                cyber_score=random.randint(40,100),

                regulatory_score=random.randint(40,100),

                overall_score=random.randint(40,100)

            )

        self.stdout.write(
            self.style.SUCCESS(
                "Dummy Vendors Created"
            )
        )