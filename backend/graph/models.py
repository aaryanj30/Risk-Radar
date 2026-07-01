from django.db import models

class GraphNode(models.Model):

    NODE_TYPES = [
        ("Vendor", "Vendor"),
        ("Application", "Application"),
        ("API", "API"),
        ("BusinessUnit", "BusinessUnit"),
    ]

    name = models.CharField(max_length=255)

    node_type = models.CharField(
        max_length=50,
        choices=NODE_TYPES
    )

    risk_score = models.FloatField(default=0)

class GraphEdge(models.Model):

    source = models.ForeignKey(
        GraphNode,
        related_name="source_node",
        on_delete=models.CASCADE
    )

    target = models.ForeignKey(
        GraphNode,
        related_name="target_node",
        on_delete=models.CASCADE
    )

    relationship = models.CharField(
        max_length=100
    )

    weight = models.FloatField(
        default=1.0
    )