from django.shortcuts import render
from rest_framework import viewsets, mixins
from api.gina.models import TreeInfo, TreeType, UserInfo, UserTreeInfo
from api.gina.serializer import TreeInfoSerializer, TreeTypeSerializer, UserInfoSerializer, UserTreeSerializer

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

class UserTreeViewset(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = UserTreeInfo.objects.order_by("planted_on")
    serializer_class = UserTreeSerializer
