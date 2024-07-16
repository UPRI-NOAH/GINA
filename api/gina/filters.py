import django_filters
from api.gina.models import TreeInfo

class TreeInfoFilter(django_filters.FilterSet):
    class Meta:
        model = TreeInfo
        fields = {
            "tree_id": ["exact"],
            "tree_type": ["icontains"],
            "tree_name": ["iexact", "icontains"],
            "scientific_name": ["iexact", "icontains"],
            "family_name": ["iexact", "icontains"]
        }
