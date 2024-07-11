from django.shortcuts import render
from rest_framework import viewsets, mixins
from api.gina.models import UserInfo
from api.gina.serializer import UserInfoSerializer

# Create your views here.
class UserInfoViewset(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = UserInfo.objects.order_by("username")
    serializer_class = UserInfoSerializer