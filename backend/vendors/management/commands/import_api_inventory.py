import pandas as pd

from django.core.management.base import BaseCommand

from api_security.models import EnterpriseAPI


class Command(BaseCommand):

    def handle(self, *args, **kwargs):

        df = pd.read_csv(
            "api_inventory.csv"
        )

        EnterpriseAPI.objects.all().delete()

        for _, row in df.iterrows():

            EnterpriseAPI.objects.create(

                name=row["api_name"],

                endpoint=row["endpoint"],

                auth=row["authentication"] != "None",

                tls=bool(row["tls_enabled"]),

                rate_limit=bool(row["rate_limit"]),

                status=row["status"],

                owner=row["business_unit"],

                last_used=pd.to_datetime(row["last_used"]).date(),

                risk_score=float(row["risk_score"]),

                vendor=row["vendor"]
            )

        print("API inventory imported")