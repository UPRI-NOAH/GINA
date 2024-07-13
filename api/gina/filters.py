import django_filters
from api.gina.models import TreeInfo, TreeType

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