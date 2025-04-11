from rest_framework import serializers
from api.gina.models import TreeInfo, TreeType, UserInfo, UserTreeInfo
from PIL import Image
from django.core.files.base import ContentFile
import io

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