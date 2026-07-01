import pandas as pd

from django.core.management.base import BaseCommand

from graph.models import (
    GraphNode,
    GraphEdge
)


class Command(BaseCommand):

    help = "Import enterprise graph data"

    def handle(self, *args, **kwargs):

        self.stdout.write(
            self.style.WARNING(
                "Deleting existing graph data..."
            )
        )

        GraphEdge.objects.all().delete()
        GraphNode.objects.all().delete()

        # 1. Load app_id to name mapping from applications CSV
        apps_df = pd.read_csv("enterprise_applications.csv")
        app_id_to_name = {}
        vendors = set()
        applications = set()
        
        for _, row in apps_df.iterrows():
            unique_app_name = f"{row['vendor']} - {row['application']}"
            app_id_to_name[str(row["app_id"])] = unique_app_name
            vendors.add(str(row["vendor"]))
            applications.add(unique_app_name)

        def get_resolved_name(name):
            return app_id_to_name.get(name, name)

        # 2. Import Risk Scores (Create all nodes first with correct names & scores)
        self.stdout.write(
            self.style.SUCCESS(
                "Importing Risk Scores..."
            )
        )

        risk_df = pd.read_csv("enterprise_risk.csv")

        for _, row in risk_df.iterrows():

            raw_name = str(row["node"])
            propagated_risk = float(row["propagated_risk"])
            resolved_name = get_resolved_name(raw_name)

            # Determine node type
            if resolved_name.startswith("API") or resolved_name.startswith("SHADOW"):
                node_type = "API"
            elif resolved_name in ["Payments", "CRM", "Storage", "Finance", "HR", "Analytics", "Identity", "DevOps"]:
                node_type = "BusinessUnit"
            elif resolved_name in vendors:
                node_type = "Vendor"
            elif resolved_name in applications:
                node_type = "Application"
            else:
                node_type = "Application"

            node, _ = GraphNode.objects.get_or_create(
                name=resolved_name,
                defaults={"node_type": node_type}
            )

            node.risk_score = propagated_risk
            node.save()

        # 3. Create Vendor-App Edges
        self.stdout.write(
            self.style.SUCCESS(
                "Importing Applications & Edges..."
            )
        )

        for _, row in apps_df.iterrows():
            vendor_name = str(row["vendor"])
            app_name = f"{row['vendor']} - {row['application']}"
            
            vendor_node = GraphNode.objects.filter(name=vendor_name).first()
            app_node = GraphNode.objects.filter(name=app_name).first()
            
            if vendor_node and app_node:
                GraphEdge.objects.get_or_create(
                    source=vendor_node,
                    target=app_node,
                    relationship="Vendor-App",
                    weight=0.8
                )

        # 4. Import Enterprise Graph Edges
        self.stdout.write(
            self.style.SUCCESS(
                "Importing Enterprise Graph Edges..."
            )
        )

        graph_df = pd.read_csv("enterprise_graph.csv")

        for _, row in graph_df.iterrows():
            source_resolved = get_resolved_name(str(row["source"]))
            target_resolved = get_resolved_name(str(row["target"]))
            weight = float(row["weight"])

            source_node = GraphNode.objects.filter(name=source_resolved).first()
            target_node = GraphNode.objects.filter(name=target_resolved).first()

            if source_node and target_node:
                GraphEdge.objects.get_or_create(
                    source=source_node,
                    target=target_node,
                    relationship="CONNECTED_TO",
                    weight=weight
                )

        self.stdout.write(
            self.style.SUCCESS(
                "Graph Data Imported successfully."
            )
        )