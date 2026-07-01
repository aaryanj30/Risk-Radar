import pandas as pd

from django.core.management.base import BaseCommand

from vendors.models import Vendor


class Command(BaseCommand):

    def handle(self, *args, **kwargs):

        df = pd.read_csv("vendor_summary.csv")

        Vendor.objects.all().delete()

        for _, row in df.iterrows():

            Vendor.objects.create(

                name=row["vendor"],

                cybersecurity=row["Cybersecurity"],

                financial=row["Financial"],

                compliance=row["Compliance"],

                operational=row["Operational"],

                risk_events_count=row["risk_events_count"],

                risk_score=row["risk_score"],

                risk_level=row["risk_level"]
            )

        print("Imported vendors")