import pandas as pd

from django.core.management.base import BaseCommand

from alerts.models import Alert


class Command(BaseCommand):

    def handle(self, *args, **kwargs):

        df = pd.read_csv("master_news.csv")

        Alert.objects.all().delete()

        count = 0

        for _, row in df.iterrows():

            severity = (
                str(row["severity"])
                if pd.notna(row["severity"])
                else "Medium"
            )

            category = (
                str(row["category"])
                if pd.notna(row["category"])
                else "General"
            )

            vendor = (
                str(row["vendor"])
                if pd.notna(row["vendor"])
                else "Unknown"
            )

            title = (
                str(row["title"])
                if pd.notna(row["title"])
                else "Risk Event"
            )

            Alert.objects.create(

                vendor=vendor,

                title=title[:255],

                severity=severity,

                category=category
            )

            count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"{count} alerts created"
            )
        )