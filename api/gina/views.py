from django.shortcuts import render
from rest_framework import generics, viewsets, mixins
from api.gina.throttles import FailedLoginThrottle
from api.gina.models import TreeInfo, TreeType, UserInfo, UserTreeInfo, IdentifyTreeInfo, UserTreeArchive, Notification
from api.gina.serializer import (TreeInfoSerializer, TreeTypeSerializer, UserInfoSerializer, UserTreeSerializer, 
                                 IdentifyTreeInfoSerializer, UserTreeArchiveInfoSerializer,NotificationSerializer, 
                                 SubscriptionSerializer, CustomUserCreateSerializer, CustomAuthTokenSerializer)
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
from rest_framework import serializers
from api.gina.emails import CustomActivationEmail
import hmac
import hashlib
from rest_framework.decorators import action
from django.db import transaction
import redis
from api.gina.celery_app import app as celery_app
from copy import deepcopy

User = get_user_model()
redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)


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
    user = request.user  # This is the recipient
    unseen = user.notifications.filter(is_seen=False)

    updated_count = 0

    for notif in unseen:
        changed = False

        # Mark notification itself as seen
        if not notif.is_seen:
            notif.is_seen = True
            changed = True

        # Mark ALL commenters as seen (because recipient has now seen them)
        if notif.commenters:
            new_commenters = []
            print(new_commenters)
            for c in notif.commenters:
                if isinstance(c, dict):
                    if not c.get("seen", False):
                        c["seen"] = True
                        changed = True
                new_commenters.append(c)
            print(new_commenters)

            notif.commenters = new_commenters  # Replace with updated list

        if changed:
            notif.save()
            updated_count += 1

    return Response({'message': f'{updated_count} notifications marked as seen'})


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
            "tree_name": str(tree.tree_name),
            "notif_type": "tree_help",
            "recipient": next_expert.user.username,
            "is_passed": False,
        }
    )

    return Response({"detail": f"{next_expert.user.username} has been notified."}, status=200)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    # Token.objects.filter(user=request.user).delete()
    if request.auth:
        request.auth.delete()
    return Response({"detail": "Logged out"}, status=200)



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

    @action(detail=False, methods=['delete'], permission_classes=[IsAuthenticated])
    def delete_account(self, request):
        user = request.user
        password = request.data.get('password')

        # Check if password is correct
        if not user.check_password(password):
            return Response(
                {"detail": "Incorrect password."},
                status=400
            )

        with transaction.atomic():
            # Delete related data
            UserTreeInfo.objects.filter(owning_user__user=user).delete()
            IdentifyTreeInfo.objects.filter(identified_by__user=user).delete()
            UserTreeArchive.objects.filter(owning_user__user=user).delete()
            PushSubscription.objects.filter(user=user).delete()
            Notification.objects.filter(recipient=user).delete()
            UserInfo.objects.filter(user=user).delete()
            user.delete()

        return Response(
            {"detail": "Your account and all associated data have been permanently deleted."},
            status=204
        )

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

    def perform_destroy(self, instance):
        user = self.request.user
        tree = instance.tree_identifier

        comment_id = instance.id  # Save the ID before deletion
        instance.delete()

        notif = Notification.objects.filter(
            recipient=tree.owning_user.user,
            notif_type="comment",
            related_tree=tree,
        ).order_by('-created_at').first()

        if notif:
            import json
            parsed_commenters = []
            for c in notif.commenters:
                if isinstance(c, str):
                    try:
                        parsed_commenters.append(json.loads(c))
                    except json.JSONDecodeError:
                        continue
                elif isinstance(c, dict):
                    parsed_commenters.append(c)

            # Remove the deleted comment
            filtered_commenters = [
                c for c in parsed_commenters
                if c.get("comment_id") != comment_id
            ]

            notif.commenters = filtered_commenters

            if not notif.commenters:
                notif.delete()
                return

            remaining_comments = IdentifyTreeInfo.objects.filter(tree_identifier=tree)

            if not remaining_comments.exists():
                notif.delete()
                return

            tree_owner_username = tree.owning_user.user.username

            # Find latest commenter who is NOT the owner
            latest_non_owner_comment = remaining_comments.exclude(
                identified_by__user__username=tree_owner_username
            ).order_by('-identified_on').first()

            if not latest_non_owner_comment:
                # Only owner has commented, remove notif
                notif.delete()
                return

            latest_user = latest_non_owner_comment.identified_by.user.username

            # Compute "others" excluding latest user AND owner
            unique_usernames = set(
                c["username"] for c in notif.commenters if isinstance(c, dict)
            )
            unique_usernames.discard(latest_user)
            unique_usernames.discard(tree_owner_username)

            others_count = len(unique_usernames)

            if others_count == 0:
                notif.message = f"💬 {latest_user} commented on your tree: {tree.tree_name}"
            elif others_count == 1:
                notif.message = f"💬 {latest_user} and 1 other commented on your tree: {tree.tree_name}"
            else:
                notif.message = f"💬 {latest_user} and {others_count} others commented on your tree: {tree.tree_name}"

            notif.is_seen = all(c.get("seen", False) for c in notif.commenters)
            notif.save(update_fields=["commenters", "is_seen", "message", "created_at"])


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
    serializer_class = CustomAuthTokenSerializer

    def post(self, request, *args, **kwargs):
        throttle = FailedLoginThrottle()

        # Throttle check first
        if not throttle.allow_request(request, self):
            return Response(
                {"error": "Too many failed login attempts. Try again later."}, 
                status=429
            )

        # hCaptcha check
        captcha_token = request.data.get("hcaptcha_token")
        if not captcha_token:
            return Response({"error": "Missing hCaptcha token."}, status=400)

        captcha_data = {
            "secret": settings.HCAPTCHA_SECRET_KEY,
            "response": captcha_token,
        }
        captcha_response = requests.post("https://hcaptcha.com/siteverify", data=captcha_data)
        captcha_result = captcha_response.json()

        if not captcha_result.get("success"):
            return Response({"error": "Captcha verification failed."}, status=400)

        # Attempt login
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data["user"]
        except Exception:
            # Increment failed attempts
            throttle.increment(request)
            return Response({"error": "Invalid credentials"}, status=400)

        # Successful login
        throttle.reset(request)  # reset failed attempt counter

        token = Token.objects.create(user=user)
        # token, _ = Token.objects.get_or_create(user=user)

        try:
            user_type = UserInfo.objects.get(user=user).user_type
        except UserInfo.DoesNotExist:
            user_type = None

        return Response({
            "auth_token": token.key,
            "username": user.username,
            "user_type": user_type,
        }, status=200)
    
    

class RegisterWithCaptchaView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        captcha_token = request.data.get("hcaptcha_token")
        if not captcha_token:
            return Response({"error": "Missing hCaptcha token."}, status=400)

        # Verify hCaptcha
        data = {
            'secret': settings.HCAPTCHA_SECRET_KEY,
            'response': captcha_token
        }
        captcha_response = requests.post('https://hcaptcha.com/siteverify', data=data)
        captcha_result = captcha_response.json()

        if not captcha_result.get('success'):
            return Response({"error": "Captcha verification failed."}, status=400)

        # Proceed to create user
        data = request.data.copy()
        data.pop('hcaptcha_token', None)
        serializer = CustomUserCreateSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()

            # Send activation email manually (because we bypassed Djoser's default view)
            if settings.DJOSER.get('SEND_ACTIVATION_EMAIL', False):
                context = {'user': user}
                to = [getattr(user, user.get_email_field_name())]
                CustomActivationEmail(request, context).send(to)

            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=400)
    

class ValidateImageAPIView(APIView):
    def post(self, request):
        image = request.FILES.get('image')
        if not image:
            return Response({"detail": "No image uploaded"}, status=400)

        # We only need the image field, so create a minimal serializer instance
        serializer = UserTreeSerializer()

        try:
            serializer.validate_and_embed_image(image)
            return Response({"valid": True})
        except serializers.ValidationError as e:
            return Response({"valid": False, "detail": str(e)}, status=400)
        except Exception as e:
            return Response({"valid": False, "detail": f"Unexpected error: {str(e)}"}, status=500)
        

# def generate_onesignal_hash(user_id: str, api_key: str) -> str:
#     return hmac.new(
#         key=api_key.encode(),
#         msg=user_id.encode(),
#         digestmod=hashlib.sha256
#     ).hexdigest()


# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def onesignal_identity(request):
#     user_id = str(request.user.id)  # or use username if you prefer
#     api_key = settings.ONESIGNAL_API_KEY
#     user_hash = generate_onesignal_hash(user_id, api_key)
#     return Response({
#         "external_user_id": user_id,
#         "user_hash": user_hash,
#     })
