from rest_framework import serializers
from api.gina.models import TreeInfo, TreeType

class TreeInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreeInfo
        fields = '__all__'
        
class TreeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreeType
        fields = '__all__'