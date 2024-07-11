from rest_framework import viewsets, mixins
from api.gina.models import TreeInfo
from api.gina.serializer import TreeInfoSerializer

# Create your views here.
class TreeInfoViewset(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = TreeInfo.objects.order_by("tree_name")
    serializer_class = TreeInfoSerializer