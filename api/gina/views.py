from django.shortcuts import render
from rest_framework import generics, viewsets, mixins
from api.gina.models import TreeInfo, TreeType, UserInfo, UserTreeInfo, IdentifyTreeInfo, UserTreeArchive
from api.gina.serializer import TreeInfoSerializer, TreeTypeSerializer, UserInfoSerializer, UserTreeSerializer, IdentifyTreeInfoSerializer, UserTreeArchiveInfoSerializer
from api.gina.filters import TreeInfoFilter, TreeTypeFilter, UserInfoFilter, UserTreeFilter, IdentifyTreeFilter, UserTreeArchiveTreeFilter
from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema_view, extend_schema
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.shortcuts import render


def reset_password(request):
    return render(request, 'reset_password.html')

def activate_page(request):
    return render(request, 'activate.html') 

@extend_schema_view(
    list=extend_schema(description="Returns a list of all information for all plantable trees")
)
class TreeInfoViewset(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = TreeInfo.objects.order_by("tree_name")
    serializer_class = TreeInfoSerializer
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = TreeInfoFilter

@extend_schema_view(
    list=extend_schema(description="Returns a list of all type classes for all plantable trees")
)
class TreeTypeViewset(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = TreeType.objects.order_by("type_name")
    serializer_class = TreeTypeSerializer
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = TreeTypeFilter

@extend_schema_view(
    list=extend_schema(description="Returns a list of all user profiles"),
    retrieve=extend_schema(description="Returns a user profile, identified by its username"),
    create=extend_schema(description="Creates a user profile, requires that a Django User object (identified by username) already exist for authentication purposes"),
    update=extend_schema(description="Updates a user profile, provided the username for the corresponding User object"),
    destroy=extend_schema(description="Deletes a user profile, provided the username for the corresponding User object")
)
class UserInfoViewset(viewsets.ModelViewSet):
    queryset = UserInfo.objects.order_by("user")
    serializer_class = UserInfoSerializer
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = UserInfoFilter

@extend_schema_view(
    list=extend_schema(description="Returns a list of all planted trees"),
    retrieve=extend_schema(description="Returns a planted tree, identified by its reference number"),
    create=extend_schema(description="Creates a record for a planted tree"),
    update=extend_schema(description="Updates a planted tree, identified by its reference number"),
    destroy=extend_schema(description="Deletes a planted tree, identified by its reference number")
)
class UserTreeViewset(viewsets.ModelViewSet):
    queryset = UserTreeInfo.objects.order_by("planted_on")
    serializer_class = UserTreeSerializer
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = UserTreeFilter
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        # Find the UserInfo object that matches the current logged-in user
        user_info = UserInfo.objects.get(user=self.request.user)
        serializer.save(owning_user=user_info)

@extend_schema_view(
    list=extend_schema(description="Returns a list of all planted trees"),
    retrieve=extend_schema(description="Returns a planted tree, identified by its reference number"),
    create=extend_schema(description="Creates a record for a planted tree"),
    update=extend_schema(description="Updates a planted tree, identified by its reference number"),
    destroy=extend_schema(description="Deletes a planted tree, identified by its reference number")
)
class IdentifyTreeInfoViewset(viewsets.ModelViewSet):
    queryset = IdentifyTreeInfo.objects.order_by("-id")
    serializer_class = IdentifyTreeInfoSerializer
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = IdentifyTreeFilter
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        user_info = UserInfo.objects.get(user=self.request.user)
        serializer.save(identified_by=user_info)


@extend_schema_view(
    list=extend_schema(description="Returns a list of all planted trees"),
    retrieve=extend_schema(description="Returns a planted tree, identified by its reference number"),
    create=extend_schema(description="Creates a record for a planted tree"),
    update=extend_schema(description="Updates a planted tree, identified by its reference number"),
    destroy=extend_schema(description="Deletes a planted tree, identified by its reference number")
)
class UserTreeArchiveViewset(viewsets.ModelViewSet):
    queryset = UserTreeArchive.objects.order_by("-id")
    serializer_class = UserTreeArchiveInfoSerializer
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = UserTreeArchiveTreeFilter

    permission_classes = [IsAuthenticatedOrReadOnly]
    def perform_create(self, serializer):
        # Find the UserInfo object that matches the current logged-in user
        user_info = UserInfo.objects.get(user=self.request.user)
        serializer.save(owning_user=user_info)