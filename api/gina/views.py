from rest_framework import viewsets, mixins
from api.gina.models import TreeInfo, TreeType
from api.gina.serializer import TreeInfoSerializer, TreeTypeSerializer

# Create your views here.
class TreeInfoViewset(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = TreeInfo.objects.order_by("tree_name")
    serializer_class = TreeInfoSerializer
    
class TreeTypeViewset(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = TreeType.objects.order_by("type_name")
    serializer_class = TreeTypeSerializer