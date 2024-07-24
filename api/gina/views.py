from django.shortcuts import render
from rest_framework import generics, viewsets, mixins
from api.gina.models import TreeInfo, TreeType, UserInfo, UserTreeInfo
from api.gina.serializer import TreeInfoSerializer, TreeTypeSerializer, UserInfoSerializer, UserTreeSerializer
from api.gina.filters import TreeInfoFilter, TreeTypeFilter, UserInfoFilter, UserTreeFilter
from django_filters import rest_framework as filters

# Create your views here.
class TreeInfoViewset(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = TreeInfo.objects.order_by("tree_name")
    serializer_class = TreeInfoSerializer
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = TreeInfoFilter

class TreeTypeViewset(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = TreeType.objects.order_by("type_name")
    serializer_class = TreeTypeSerializer
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = TreeTypeFilter

class UserInfoViewset(generics.ListCreateAPIView, viewsets.GenericViewSet):
    queryset = UserInfo.objects.order_by("user")
    serializer_class = UserInfoSerializer
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = UserInfoFilter

class UserTreeViewset(generics.ListCreateAPIView, viewsets.GenericViewSet):
    queryset = UserTreeInfo.objects.order_by("planted_on")
    serializer_class = UserTreeSerializer
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = UserTreeFilter
