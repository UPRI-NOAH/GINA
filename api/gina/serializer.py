from rest_framework import serializers
from api.gina.models import TreeInfo, TreeType, UserInfo, UserTreeInfo

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