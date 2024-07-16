from django_filters.rest_framework.backends import DjangoFilterBackend
from rest_framework import viewsets, mixins
from api.gina.models import TreeInfo, TreeType
from api.gina.serializer import TreeInfoSerializer, TreeTypeSerializer
from api.gina.filters import TreeInfoFilter, TreeTypeFilter

# Create your views here.
class TreeInfoViewset(mixins.ListModelMixin, viewsets.GenericViewSet):
    filter_backends = (DjangoFilterBackend, )
    filterset_class = TreeInfoFilter
    queryset = TreeInfo.objects.order_by("tree_name")
    serializer_class = TreeInfoSerializer
    
class TreeTypeViewset(mixins.ListModelMixin, viewsets.GenericViewSet):
    filter_backends = (DjangoFilterBackend, )
    filterset_class = TreeTypeFilter
    queryset = TreeType.objects.order_by("type_name")
    serializer_class = TreeTypeSerializer