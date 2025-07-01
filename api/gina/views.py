from django.shortcuts import render
from rest_framework import generics, viewsets, mixins
from api.gina.models import TreeInfo, TreeType, UserInfo, UserTreeInfo, IdentifyTreeInfo, UserTreeArchive, Notification
from api.gina.serializer import TreeInfoSerializer, TreeTypeSerializer, UserInfoSerializer, UserTreeSerializer, IdentifyTreeInfoSerializer, UserTreeArchiveInfoSerializer, NotificationSerializer
from api.gina.filters import TreeInfoFilter, TreeTypeFilter, UserInfoFilter, UserTreeFilter, IdentifyTreeFilter, UserTreeArchiveTreeFilter, NotificationFilter
from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema_view, extend_schema
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.shortcuts import render
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from api.gina.models import PushSubscription 
from rest_framework.authentication import TokenAuthentication

@api_view(['POST'])
def save_subscription(request):
    user = request.user
    data = request.data
    sub = data.get("subscription")

    if not sub:
        return Response({"error": "Missing subscription"}, status=400)

    endpoint = sub.get("endpoint")

    if not endpoint:
        return Response({"error": "Missing endpoint"}, status=400)

    exists = PushSubscription.objects.filter(
        user=user, subscription__endpoint=endpoint
    ).exists()

    if not exists:
        PushSubscription.objects.create(user=user, subscription=sub)
        return Response({"status": "subscription saved"}, status=201)
    else:
        return Response({"status": "subscription already exists"}, status=200)
    

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def unsubscribe(request):
    user = request.user
    endpoint = request.data.get('endpoint')

    if not endpoint:
        return Response({"error": "Missing endpoint"}, status=400)

    deleted_count, _ = PushSubscription.objects.filter(
        user=user,
        subscription__endpoint=endpoint
    ).delete()

    if deleted_count:
        return Response({"status": "unsubscribed"}, status=200)
    else:
        return Response({"status": "no matching subscription found"}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_seen(request):
    user = request.user
    unseen = user.notifications.filter(is_seen=False)
    unseen.update(is_seen=True)
    return Response({'message': f'{unseen.count()} notifications marked as seen'})


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

@extend_schema_view(
    list=extend_schema(description="Returns a list of all planted trees"),
    retrieve=extend_schema(description="Returns a planted tree, identified by its reference number"),
    create=extend_schema(description="Creates a record for a planted tree"),
    update=extend_schema(description="Updates a planted tree, identified by its reference number"),
    destroy=extend_schema(description="Deletes a planted tree, identified by its reference number")
)
class NotificationViewSet(viewsets.ModelViewSet):
    # queryset = Notification.objects.order_by("-id")
    serializer_class = NotificationSerializer
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = NotificationFilter
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Notification.objects.filter(recipient=user).order_by('-created_at')
        return Notification.objects.none() 
