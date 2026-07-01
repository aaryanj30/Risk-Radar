import csv
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import (
    GraphNode,
    GraphEdge
)

from .serializers import (
    GraphNodeSerializer,
    GraphEdgeSerializer
)


class GraphView(APIView):

    def get(self, request):
        notification_service = GraphNode.objects.filter(name="AWS - Notification Service").first()
        app_004 = GraphNode.objects.filter(name="APP004").first()

        apps_csv_path = settings.BASE_DIR / "enterprise_applications.csv"
        risk_csv_path = settings.BASE_DIR / "enterprise_risk.csv"
        graph_csv_path = settings.BASE_DIR / "enterprise_graph.csv"

        # If data is unpopulated, or has old app_id format in names, perform self-healing import
        if not notification_service or notification_service.risk_score == 0.0 or app_004:
            GraphEdge.objects.all().delete()
            GraphNode.objects.all().delete()

            # 1. Load app_id to name mapping from applications CSV
            app_id_to_name = {}
            vendors = set()
            applications = set()
            
            if apps_csv_path.exists():
                with open(apps_csv_path, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        unique_app_name = f"{row['vendor']} - {row['application']}"
                        app_id_to_name[row["app_id"]] = unique_app_name
                        vendors.add(row["vendor"])
                        applications.add(unique_app_name)

            def get_resolved_name(name):
                return app_id_to_name.get(name, name)

            # 2. Create all nodes with correct risk scores
            if risk_csv_path.exists():
                with open(risk_csv_path, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        raw_name = row["node"]
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
            if apps_csv_path.exists():
                with open(apps_csv_path, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        vendor_name = row["vendor"]
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

            # 4. Create Graph Edges from enterprise_graph.csv
            if graph_csv_path.exists():
                with open(graph_csv_path, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        source_resolved = get_resolved_name(row["source"])
                        target_resolved = get_resolved_name(row["target"])
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

        nodes = GraphNode.objects.all()
        edges = GraphEdge.objects.all()

        # Read raw CSV data for frontend display
        enterprise_applications = []
        if apps_csv_path.exists():
            with open(apps_csv_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                enterprise_applications = list(reader)

        enterprise_graph = []
        if graph_csv_path.exists():
            with open(graph_csv_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                enterprise_graph = list(reader)

        enterprise_risk = []
        if risk_csv_path.exists():
            with open(risk_csv_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                enterprise_risk = list(reader)

        return Response({
            "nodes": GraphNodeSerializer(nodes, many=True).data,
            "edges": GraphEdgeSerializer(edges, many=True).data,
            "raw_csv": {
                "applications": enterprise_applications,
                "graph": enterprise_graph,
                "risk": enterprise_risk
            }
        })