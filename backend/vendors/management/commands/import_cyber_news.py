import pandas as pd

from django.core.management.base import BaseCommand

from vendors.models import CyberNews


class Command(BaseCommand):

    help = "Import cyber news CSV"

    def handle(self, *args, **kwargs):

        df = pd.read_csv("cyber_news.csv")

        CyberNews.objects.all().delete()

        count = 0

        for _, row in df.iterrows():

            CyberNews.objects.create(

                vendor=str(
                    row.get("vendor", "")
                ),

                title=str(
                    row.get("title", "")
                ),

                published=str(
                    row.get("published", "")
                ),

                risk_category=str(
                    row.get("risk_category", "")
                ),

                cyber_hits=int(
                    row.get("cyber_hits", 0)
                ),

                financial_hits=int(
                    row.get("financial_hits", 0)
                ),

                compliance_hits=int(
                    row.get("compliance_hits", 0)
                ),

                operational_hits=int(
                    row.get("operational_hits", 0)
                )
            )

            count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Imported {count} cyber news records"
            )
        )