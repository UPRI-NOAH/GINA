from rest_framework import serializers
from api.gina.models import TreeInfo

class TreeInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreeInfo
        fields = '__all__'