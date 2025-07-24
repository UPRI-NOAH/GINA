import django_filters
from api.gina.models import TreeInfo, TreeType, UserInfo, UserTreeInfo, IdentifyTreeInfo, UserTreeArchive, Notification

class TreeInfoFilter(django_filters.FilterSet):
    class Meta:
        model = TreeInfo
        fields = {
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
            "user": ["exact"],
            "first_name": ["exact"],
            "last_name": ["exact"],
            "user_points": ["exact"],
        }

class UserTreeFilter(django_filters.FilterSet):
    class Meta:
        model = UserTreeInfo
        fields = {
            "reference_id": ["exact"],
            "planted_on": ["exact"],
            "model_tree__tree_name": ["icontains"],
            "owning_user__user": ["exact"],
            "quantity": ["exact"],
            "status": ["exact"],
            "version": ["exact"],
        }

class IdentifyTreeFilter(django_filters.FilterSet):
    class Meta:
        model = IdentifyTreeInfo
        fields = {
            "tree_identifier__reference_id": ["exact"],
            "tree_comment": ["exact"],
            "identified_on": ["exact"],
            "identified_by": ["exact"],
        }

class UserTreeArchiveTreeFilter(django_filters.FilterSet):
    class Meta:
        model = UserTreeArchive
        fields = {
            "id": ["exact"],
            "reference_id__reference_id": ["exact"],
            "owning_user__user": ["exact"],
            "planted_on": ["exact"],
        }

class NotificationFilter(django_filters.FilterSet):
    class Meta:
        model = Notification
        fields = {
            "id": ["exact"],
            "sender": ["exact"],
            "notif_type": ["exact"],
            "message": ["exact"],
            "related_tree": ["exact"],
            "related_comment": ["exact"],
            "is_seen": ["exact"],
            "created_at": ["exact"],
        }