from django.shortcuts import render
from rest_framework import viewsets, mixins
from api.gina.models import TreeInfo, TreeType, UserInfo
from api.gina.serializer import TreeInfoSerializer, TreeTypeSerializer, UserInfoSerializer

# Create your views here.
class TreeInfoViewset(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = TreeInfo.objects.order_by("tree_name")
    serializer_class = TreeInfoSerializer
    
class TreeTypeViewset(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = TreeType.objects.order_by("type_name")
    serializer_class = TreeTypeSerializer

class UserInfoViewset(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = UserInfo.objects.order_by("username")
    serializer_class = UserInfoSerializer