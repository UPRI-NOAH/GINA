import django_filters
from api.gina.models import TreeInfo, TreeType

class TreeInfoFilter(django_filters.FilterSet):
    class Meta:
        model = TreeInfo
        fields = {
            "tree_id": ["exact"],
            "tree_name": ["iexact", "icontains"],
            "scientific_name": ["iexact", "icontains"],
            "family_name": ["iexact", "icontains"]
        }

class TreeTypeFilter(django_filters.FilterSet):
    class Meta:
        model = TreeType
        fields = {
            "type_name": ["iexact", "icontains"]
        }
