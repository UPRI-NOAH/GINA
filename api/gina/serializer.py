from rest_framework import serializers
from api.gina.models import TreeInfo, TreeType, UserInfo, UserTreeInfo, IdentifyTreeInfo, UserTreeArchive, Notification
from api.gina.tree_image_utils import check_image_similarity_against_embeddings, get_image_embedding, schedule_tree_reminder
from PIL import Image
from django.core.files.base import ContentFile
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.urls import reverse
from pytz import timezone as pytz_timezone
from django.utils import timezone
from datetime import timedelta
from django.db.models import F
from rest_framework.response import Response
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from api.gina.models import PushSubscription
from api.gina.tasks import send_push_notification
import io
import random

User = get_user_model()

class CustomUserCreateSerializer(BaseUserCreateSerializer):
    class Meta(BaseUserCreateSerializer.Meta):
        model = User
        fields = ('id', 'email', 'username', 'password')

    def validate_email(self, value):
        # custom email validation
        if not value or '@' not in value:
            raise serializers.ValidationError("Enter a valid email address.")
        
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        
        return value

    def validate_username(self, value):
        # custom username validation
        if not value or len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long.")
        if ' ' in value:
            raise serializers.ValidationError("Username should not contain spaces.")
        return value

    def validate_password(self, value):
        # django's password validation
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, data):
        errors = {}

        # Email, Username, and Password errors on field-specific validation methods.
        # If no errors are raised, return the data.
        return data

class UserInfoSerializer(serializers.ModelSerializer):
    tree_count = serializers.SerializerMethodField()

    class Meta:
        model = UserInfo
        fields = '__all__'

    def get_tree_count(self, obj):
        return obj.usertreeinfo_set.count()

class TreeInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreeInfo
        fields = '__all__'
        extra_kwargs = {
            'image_embedding': {'write_only': True},  # hides in output but can accept input
        }
        
class TreeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreeType
        fields = '__all__'
        

class IdentifyTreeInfoSerializer(serializers.ModelSerializer):
    identified_on = serializers.SerializerMethodField()

    class Meta:
        model = IdentifyTreeInfo
        fields = '__all__'

    def get_identified_on(self, obj):
        manila = pytz_timezone('Asia/Manila')
        return obj.identified_on.astimezone(manila).strftime('%b %d, %Y %I:%M %p')
    
    def create(self, validated_data):
        instance = super().create(validated_data)

        # Notify tree owner
        tree = instance.tree_identifier
        commenter = self.context['request'].user
        owner = tree.owning_user.user
        tree_name = tree.tree_name
        if commenter.id != owner.id:
            message = f"{commenter.username} commented on your tree: {tree_name}"

            Notification.objects.create(
                recipient=owner,
                sender=commenter,
                notif_type="comment",
                message=message,
                related_tree=tree,
                related_comment=instance,
            )
            
            # send_push_notification.delay(owner.id, "New Comment", message)
            send_push_notification.delay(owner.id, "New Comment", message, "comment", tree.reference_id,)

            channel_layer = get_channel_layer()
            try:
                async_to_sync(channel_layer.group_send)(
                    "tree_notifications",
                    {
                        "type": "send_tree_notification",
                        "message": message,
                        "tree_owner": str(owner),
                        "user": commenter.username,
                        "timestamp": timezone.now().isoformat(),
                        "tree_id": str(tree.reference_id),
                        "notif_type": "comment"
                    }
                )
                print("group_send completed", commenter.username)
            except Exception as e:
                print("group_send failed:", e)

        return instance

    
    def update(self, instance, validated_data):
        instance.tree_comment = validated_data.get('tree_comment', instance.tree_comment)
        instance.edited_on = timezone.now()
        instance.save()
        return instance
    
    def partial_update(self, request, *args, **kwargs):
        partial = True
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial, context={'request': request})
        if not serializer.is_valid():
            print(serializer.errors)  # Log errors to console/server logs
            return Response(serializer.errors, status=400)
        self.perform_update(serializer)
        return Response(serializer.data)
    
class UserTreeArchiveInfoSerializer(serializers.ModelSerializer):
    planted_on = serializers.SerializerMethodField()

    class Meta:
        model = UserTreeArchive
        fields = '__all__'
        extra_kwargs = {
            'image_embedding': {'write_only': True},  # hides in output but can accept input
        }

    def get_planted_on(self, obj):
        manila = pytz_timezone('Asia/Manila')
        return obj.planted_on.astimezone(manila).strftime('%b %d, %Y %I:%M %p')

    
class UserTreeSerializer(serializers.ModelSerializer):
    version = serializers.SerializerMethodField()
    latest_tree_update = serializers.SerializerMethodField()
    planted_on = serializers.SerializerMethodField()

    class Meta:
        model = UserTreeInfo
        fields = '__all__'


    def get_planted_on(self, obj):
        manila = pytz_timezone('Asia/Manila')
        return obj.planted_on.astimezone(manila).strftime('%b %d, %Y %I:%M %p')

    def get_latest_tree_update(self, obj):
        latest_archive = obj.usertreearchive_set.order_by('-planted_on').first()
        if latest_archive:
            return latest_archive.planted_on
        return None
    
    def get_version(self, obj):
        user_tree_count = UserTreeArchive.objects.filter(reference_id=obj.reference_id).count()

        return f"{user_tree_count}" #  user_tree_count to be changed to the album model

    def compress_image(self, image):
        try:
            # Open the image using PIL
            img = Image.open(image)

            # Ensure the image is in RGB mode (JPEG requires RGB)
            if img.mode != 'RGB':
                img = img.convert('RGB')

            # Optional: Resize the image to a thumbnail size (you can adjust this as needed)
            # img.thumbnail((1024, 1024))  # Uncomment if you want to resize

            # Create a buffer to save the compressed image
            buffer = io.BytesIO()

            # Save the image to the buffer in JPEG format with reduced quality
            img.save(buffer, format='JPEG', quality=60)

            # Seek to the beginning of the buffer after saving the image
            buffer.seek(0)

            # Return the image as a ContentFile that Django can save to the model
            return ContentFile(buffer.read(), name=image.name)

        except Exception as e:
            # Catch any exceptions related to image processing and raise a validation error
            raise serializers.ValidationError(f"Invalid image: {str(e)}")


    def create(self, validated_data):
        new_image = validated_data.get('image')

        if new_image:
            # Compress the image before saving
            validated_data['image'] = self.compress_image(new_image)

            # Validate similarity and get the embedding
            embedding_list = self.validate_and_embed_image(new_image)
            
        # Create the instance
        instance = super().create(validated_data)

        action = validated_data.get('action') or instance.action
        # Archive the created tree in UserTreeArchive
        UserTreeArchive.objects.create(
            reference_id=instance,
            owning_user=instance.owning_user,
            tree_name=instance.tree_name,
            tree_type=instance.tree_type,
            tree_description=instance.tree_description,
            planted_on=instance.planted_on,
            image=instance.image,
            image_embedding=embedding_list,
        )
        if action != "Identified": # Equivalent action = Planted
            schedule_tree_reminder(instance)

            if instance.tree_name == "TBD":
                self.notify_experts_tree_help(instance)
                give_points = 5
            else:
                give_points = 10

        elif (
            action == "Identified"
            # and instance.owning_user.user_type == "Regular"
            and instance.tree_name == "TBD"
        ):
            self.notify_experts_tree_help(instance)
            give_points = 0 

        else:
            give_points = 10

        if instance.owning_user and give_points:
            instance.owning_user.user_points = F('user_points') + give_points
            instance.owning_user.save(update_fields=['user_points'])
            instance.owning_user.refresh_from_db()

        return instance

    
    def update(self, instance, validated_data):
        now = timezone.now()

        # Original planting date
        planted_on = instance.planted_on

        # Calculate one hour after planting
        one_hour_after_planting = planted_on + timedelta(hours=1)

        # Find latest archive for this tree to get last edit time
        latest_archive = (
            UserTreeArchive.objects.filter(reference_id=instance)
            .order_by('-planted_on')
            .first()
        )

        last_edit_time = latest_archive.planted_on if latest_archive else planted_on
        one_hour_after_last_edit = last_edit_time + timedelta(hours=1)

        # Determine if we are within the free edit window
        in_free_edit_window = now <= one_hour_after_planting or now <= one_hour_after_last_edit

        # Handle image compression and embedding if image provided
        new_image = validated_data.get('image')
        if new_image:
            validated_data['image'] = self.compress_image(new_image)  # Compress early
            validated_data['image_embedding'] = self.validate_and_embed_image(new_image)

        # Use current time as planted_on for archive records
        new_planted_on = now

        # Remove planted_on from validated_data so main model planting date doesn't get overwritten
        validated_data.pop('planted_on', None)
        action = validated_data.pop('action', None)
        original_tree = UserTreeInfo.objects.get(reference_id=instance.reference_id)
        original_tree_name = original_tree.tree_name
        # Update the main model instance
        updated_instance = super().update(instance, validated_data)

        # Action field (might be from validated_data or from instance)
        if str(action) == "Expert":
            sender_user = self.context['request'].user
            print(original_tree_name)
            if original_tree_name == "TBD":
                allowed_fields = {"tree_name", "tree_type", "edited_by"}
                validated_data = {key: value for key, value in validated_data.items() if key in allowed_fields}
                message = f"{sender_user} identified your tree: {updated_instance.tree_name}"
                
                Notification.objects.create(
                    recipient=updated_instance.owning_user.user,
                    sender=sender_user,
                    notif_type="reminder",
                    message=message,
                    related_tree=updated_instance,
                )

                send_push_notification.delay(sender_user.id, "Identified", message, "reminder", instance.reference_id,)

                channel_layer = get_channel_layer()
                try:
                    async_to_sync(channel_layer.group_send)(
                        "tree_notifications",
                        {
                            "type": "send_tree_notification",
                            "message": message,
                            "tree_owner": str(updated_instance.owning_user.user),
                            "user": sender_user.username,
                            "timestamp": timezone.now().isoformat(),
                            "tree_id": str(updated_instance.reference_id),
                            "tree_name": str(updated_instance.tree_name),
                            "notif_type": "reminder"
                        }
                    )
                    print("group_send completed", sender_user.username)
                except Exception as e:
                    print("group_send failed:", e)

                user_info = sender_user.userinfo
                if user_info:
                    user_info.user_points = F('user_points') + 10
                    user_info.save(update_fields=['user_points'])
                    user_info.refresh_from_db()
            else:
                raise serializers.ValidationError("This tree has already been identified. Please refresh the app")

        else:
            if in_free_edit_window:
                try:
                    archive = UserTreeArchive.objects.filter(reference_id=updated_instance).latest('planted_on')
                    created = False
                except UserTreeArchive.DoesNotExist:
                    archive = UserTreeArchive.objects.create(
                        reference_id=updated_instance,
                        owning_user=updated_instance.owning_user,
                        tree_name=updated_instance.tree_name,
                        tree_type=updated_instance.tree_type,
                        tree_description=updated_instance.tree_description,
                        # planted_on=new_planted_on,
                        image=updated_instance.image,
                        image_embedding=validated_data.get('image_embedding'),
                    )
                    created = True

                if not created:
                    archive.tree_name = updated_instance.tree_name
                    archive.tree_type = updated_instance.tree_type
                    archive.tree_description = updated_instance.tree_description
                    # archive.planted_on = new_planted_on
                    archive.image = updated_instance.image
                    if 'image_embedding' in validated_data:
                        archive.image_embedding = validated_data['image_embedding']
                    archive.save()
            else:
                # Outside free edit window: create a new archive entry only if unique
                # Check if identical archive entry already exists
                exists = UserTreeArchive.objects.filter(
                    reference_id=updated_instance,
                    tree_name=updated_instance.tree_name,
                    tree_type=updated_instance.tree_type,
                    tree_description=updated_instance.tree_description,
                    planted_on=new_planted_on,
                    image=updated_instance.image
                ).exists()

                if not exists:
                    UserTreeArchive.objects.create(
                        reference_id=updated_instance,
                        owning_user=updated_instance.owning_user,
                        tree_name=updated_instance.tree_name,
                        tree_type=updated_instance.tree_type,
                        tree_description=updated_instance.tree_description,
                        planted_on=new_planted_on,
                        image=updated_instance.image,
                        image_embedding=validated_data.get('image_embedding'),
                    )
                    
                if action == "Planted":
                    schedule_tree_reminder(updated_instance)
                    # Award points if applicable
                    user_info = updated_instance.owning_user
                    if user_info:
                        user_info.user_points = F('user_points') + 5
                        user_info.save(update_fields=['user_points'])
                        user_info.refresh_from_db()

        return updated_instance
    
    
    def validate_and_embed_image(self, image):
        user_tree_images = UserTreeArchive.objects.exclude(image='').exclude(image_embedding__isnull=True)
        reference_tree_images = TreeInfo.objects.exclude(tree_image='').exclude(image_embedding__isnull=True)
        combined_entries = list(user_tree_images) + list(reference_tree_images)
        print(f"Checking similarity against {len(combined_entries)} images")

        try:
            new_embedding = get_image_embedding(image)
            print(f"Uploaded image embedding sample: {new_embedding[:5]}")

            is_similar, score, match_id = check_image_similarity_against_embeddings(new_embedding, combined_entries)
            print(f"Similarity result: {is_similar} with score {score} and match id {match_id}")
        except Exception as e:
            print(f"Error during similarity check: {e}")
            raise serializers.ValidationError(f"Image similarity check failed: {e}")

        if not is_similar:
            print("Image not similar, raising validation error")
            raise serializers.ValidationError(
                "Uploaded image does not match any known tree or seedling. Please upload a clearer or valid tree photo."
            )

        return new_embedding.tolist()
    
    def notify_experts_tree_help(self, instance):
        expert_users = list(UserInfo.objects.filter(user_type='Expert').exclude(user=instance.owning_user.user))

        random_experts = random.sample(expert_users, min(len(expert_users), 2))

        message = f"{instance.owning_user.user} needs help identifying a tree"
        for expert in random_experts:
            Notification.objects.create(
                recipient=expert.user,
                sender=instance.owning_user.user,
                notif_type="tree_help",
                message=message,
                related_tree=instance,
            )
            send_push_notification.delay(
                expert.user.id,
                "Tree Identification Needed",
                message,
                "tree_help",
                str(instance.reference_id),
            )
            
            channel_layer = get_channel_layer()
            try:
                async_to_sync(channel_layer.group_send)(
                    "tree_notifications",
                    {
                        "type": "send_tree_notification",
                        "message": message,
                        "tree_owner": instance.owning_user.user.username,
                        "user": instance.owning_user.user.username,
                        "timestamp": timezone.now().isoformat(),
                        "tree_id": str(instance.reference_id),
                        "tree_name": str(instance.tree_name),
                        "notif_type": "tree_help",
                        "recipient": expert.user.username,
                    }
                )
                print("group_send to experts completed", instance.owning_user.user)
            except Exception as e:
                print("group_send to experts failed:", e)


class NotificationSerializer(serializers.ModelSerializer):
    sender_username = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(format="%b %d, %Y %I:%M %p")
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()
    tree_name = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = '__all__'

    def get_sender_username(self, obj):
        return obj.sender.username if obj.sender else None
    
    def get_lat(self, obj):
            return obj.related_tree.latitude if obj.related_tree else None

    def get_lng(self, obj):
        return obj.related_tree.longitude if obj.related_tree else None
    
    def get_tree_name(self, obj):
        return obj.related_tree.tree_name if obj.related_tree else None


class SubscriptionSerializer(serializers.Serializer):
    endpoint = serializers.URLField()
    keys = serializers.DictField()
    
    def validate(self, data):
        return data