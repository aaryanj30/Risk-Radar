from rest_framework import serializers

from .models import (
    GraphNode,
    GraphEdge
)


class GraphNodeSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = GraphNode

        fields = "__all__"


class GraphEdgeSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = GraphEdge

        fields = "__all__"