from rest_framework import serializers
from api.gina.models import TreeInfo, TreeType, UserInfo, UserTreeInfo, IdentifyTreeInfo, UserTreeArchive
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

import io

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

class UserTreeArchiveInfoSerializer(serializers.ModelSerializer):
    planted_on = serializers.SerializerMethodField()

    class Meta:
        model = UserTreeArchive
        fields = '__all__'

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
        if 'image' in validated_data:
            validated_data['image'] = self.compress_image(validated_data['image'])

        instance = super().create(validated_data)

        # Archive the created tree in UserTreeArchive
        UserTreeArchive.objects.create(
            reference_id=instance,
            owning_user=instance.owning_user,
            tree_name=instance.tree_name,
            tree_type=instance.tree_type,
            tree_description=instance.tree_description,
            planted_on=instance.planted_on,
            image=instance.image, 
        )

        if instance.owning_user:
            # Increment points atomically
            instance.owning_user.user_points = F('user_points') + 10
            instance.owning_user.save(update_fields=['user_points'])
            instance.owning_user.refresh_from_db()

        return instance
    
    
    def update(self, instance, validated_data):
        
        # Pull new planted_on (for archive only), and prevent update of it in main model
        new_planted_on = validated_data.get('planted_on') or instance.planted_on
        validated_data.pop('planted_on', None)

        # Update instance
        updated_instance = super().update(instance, validated_data)

        now = timezone.now()
        one_hour_after_planting = instance.planted_on + timedelta(hours=1)
        action = validated_data.get('action') or instance.action

        if now <= one_hour_after_planting:
        #  Within 1 hour: update or create archive
            archive, created = UserTreeArchive.objects.get_or_create(
                reference_id=updated_instance,
                defaults={
                    'owning_user': updated_instance.owning_user,
                    'tree_name': updated_instance.tree_name,
                    'tree_type': updated_instance.tree_type,
                    'tree_description': updated_instance.tree_description,
                    'planted_on': new_planted_on,
                    'image': updated_instance.image,
                }
            )

            if not created:
                # Update existing archive
                archive.tree_name = updated_instance.tree_name
                archive.tree_type = updated_instance.tree_type
                archive.tree_description = updated_instance.tree_description
                archive.planted_on = new_planted_on
                archive.image = updated_instance.image
                archive.save()
        else:
            if action != "Identified":
                user_info = updated_instance.owning_user
                if user_info:
                    user_info.user_points += 5
                    user_info.save()
            # Archive the new state (after save, to get correct image name/url)
            if not UserTreeArchive.objects.filter(
                reference_id=updated_instance,
                tree_name=updated_instance.tree_name,
                tree_type=updated_instance.tree_type,
                tree_description=updated_instance.tree_description,
                planted_on=new_planted_on,
                image=updated_instance.image
            ).exists():
                UserTreeArchive.objects.create(
                    reference_id=updated_instance,
                    owning_user=updated_instance.owning_user,
                    tree_name=updated_instance.tree_name,
                    tree_type=updated_instance.tree_type,
                    tree_description=updated_instance.tree_description,
                    planted_on=new_planted_on,
                    image=updated_instance.image,
                )

        return updated_instance
