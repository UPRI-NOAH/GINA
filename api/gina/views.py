from django.shortcuts import render
from rest_framework import generics, viewsets, mixins
from api.gina.models import TreeInfo, TreeType, UserInfo, UserTreeInfo, IdentifyTreeInfo, UserTreeArchive, Notification
from api.gina.serializer import TreeInfoSerializer, TreeTypeSerializer, UserInfoSerializer, UserTreeSerializer, IdentifyTreeInfoSerializer, UserTreeArchiveInfoSerializer, NotificationSerializer, SubscriptionSerializer
from api.gina.filters import TreeInfoFilter, TreeTypeFilter, UserInfoFilter, UserTreeFilter, IdentifyTreeFilter, UserTreeArchiveTreeFilter, NotificationFilter
from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema_view, extend_schema
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from django.shortcuts import render
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from api.gina.models import PushSubscription 
from rest_framework.authentication import TokenAuthentication
from djoser.views import TokenCreateView
from rest_framework.authtoken.models import Token
from django.shortcuts import get_object_or_404
import random
from api.gina.tasks import send_push_notification
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from djoser.serializers import UserCreateSerializer
import requests
from django.conf import settings

User = get_user_model()


class SaveSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        sub_data = request.data.get("subscription")
        
        if not sub_data:
            return Response({"error": "Missing subscription"}, status=400)
        
        serializer = SubscriptionSerializer(data=sub_data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        
        endpoint = serializer.validated_data["endpoint"]
        
        # Check if endpoint already belongs to a different user
        existing = PushSubscription.objects.filter(subscription__endpoint=endpoint).first()
        if existing and existing.user != user:
            return Response({
                "error": "This subscription already belongs to another user.",
                "conflict_with_user": existing.user.username,
            }, status=400)
        
        # Allow the same user to have multiple different subscriptions
        PushSubscription.objects.update_or_create(
            user=user,
            subscription__endpoint=endpoint,
            defaults={"subscription": sub_data}
        )
        
        return Response({"status": "subscription saved"}, status=201)

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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pass_tree_notif(request, reference_id):
    user = request.user
    tree = get_object_or_404(UserTreeInfo, reference_id=reference_id)

    Notification.objects.filter(
        notif_type="tree_help",
        related_tree=tree,
        recipient=user
    ).update(is_passed=True)

    notified_user_ids = Notification.objects.filter(
        notif_type="tree_help",
        related_tree=tree
    ).values_list("recipient_id", flat=True).distinct()

    remaining_experts = list(
        UserInfo.objects.filter(user_type="Expert")
        .exclude(user=tree.owning_user)
        .exclude(user__id__in=notified_user_ids)
    )

    if not remaining_experts:
        return Response({"detail": "No more available experts."}, status=204)

    next_expert = random.choice(remaining_experts)

    message = f"{tree.owning_user.user} needs help identifying a tree"
    Notification.objects.create(
        recipient=next_expert.user,
        sender=tree.owning_user.user,
        notif_type="tree_help",
        message=message,
        related_tree=tree,
    )

    send_push_notification.delay(
        next_expert.user.id,
        "Tree Identification Needed",
        message,
        "tree_help",
        str(tree.reference_id),
    )
    print(next_expert.user.username)
    async_to_sync(get_channel_layer().group_send)(
        f"tree_notifications",
        {
            "type": "send_tree_notification",
            "message": message,
            "tree_owner": tree.owning_user.user.username,
            "user": tree.owning_user.user.username,
            "timestamp": timezone.now().isoformat(),
            "tree_id": str(tree.reference_id),
            "notif_type": "tree_help",
            "recipient": next_expert.user.username,
            "is_passed": False,
        }
    )

    return Response({"detail": f"{next_expert.user.username} has been notified."}, status=200)


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


class CustomTokenCreateView(TokenCreateView):
    def post(self, request, *args, **kwargs):

        captcha_token = request.data.get("hcaptcha_token")
        if not captcha_token:
            return Response({"error": "Missing hCaptcha token."}, status=400)

        data = {
            'secret': settings.HCAPTCHA_SECRET_KEY,
            'response': captcha_token
        }
        captcha_response = requests.post('https://hcaptcha.com/siteverify', data=data)
        captcha_result = captcha_response.json()

        if not captcha_result.get('success'):
            return Response({"error": "Captcha verification failed."}, status=400)

        # login
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.user

        token, _ = Token.objects.get_or_create(user=user)

        try:
            user_info = UserInfo.objects.get(user=user)
            user_type = user_info.user_type
        except UserInfo.DoesNotExist:
            user_type = None

        return Response({
            'auth_token': token.key,
            'username': user.username,
            'user_type': user_type,
        }, status=200)
    

class RegisterWithCaptchaView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        captcha_token = request.data.get("hcaptcha_token")
        if not captcha_token:
            return Response({"error": "Missing hCaptcha token."}, status=400)

        # Verify hCaptcha token
        data = {
            'secret': settings.HCAPTCHA_SECRET_KEY,
            'response': captcha_token
        }
        captcha_response = requests.post('https://hcaptcha.com/siteverify', data=data)
        captcha_result = captcha_response.json()

        if not captcha_result.get('success'):
            return Response({"error": "Captcha verification failed."}, status=400)

        # Proceed to create user
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)