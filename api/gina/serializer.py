from rest_framework import serializers
from api.gina.models import TreeInfo, TreeType, UserInfo, UserTreeInfo
from PIL import Image
from django.core.files.base import ContentFile
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.urls import reverse

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
    class Meta:
        model = UserInfo
        fields = '__all__'

class TreeInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreeInfo
        fields = '__all__'
        
class TreeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreeType
        fields = '__all__'
        
class UserTreeSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserTreeInfo
        fields = '__all__'

    def compress_image(self, image):
        img = Image.open(image)

        if img.mode != 'RGB':
            img = img.convert('RGB')

        #  optional: resize or thumbnail
        # img.thumbnail((1024, 1024))

        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=60)
        buffer.seek(0)

        return ContentFile(buffer.read(), name=image.name)

    def create(self, validated_data):
        if 'image' in validated_data:
            validated_data['image'] = self.compress_image(validated_data['image'])

        return super().create(validated_data)