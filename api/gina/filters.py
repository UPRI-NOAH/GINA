import django_filters
from api.gina.models import TreeInfo, TreeType, UserInfo

class TreeInfoFilter(django_filters.FilterSet):
    class Meta:
        model = TreeInfo
        fields = {
            "tree_id": ["exact"],
            "tree_type": ["exact"],
            "tree_name": ["icontains"],
            "scientific_name": ["icontains"],
            "family_name": ["icontains"],
        }

class TreeTypeFilter(django_filters.FilterSet):
    class Meta:
        model = TreeType
        fields = {
            "type_name": ["icontains"],
        }

class UserInfoFilter(django_filters.FilterSet):
    class Meta:
        model = UserInfo
        fields = {
            "user_id": ["exact"],
            "username": ["icontains"],
            "first_name": ["exact"],
            "last_name": ["exact"],
            "email": ["exact"],
            "user_points": ["exact"],
        }