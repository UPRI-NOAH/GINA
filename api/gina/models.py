import uuid
from django.db import models
from django.contrib.auth.models import User
from django.core.files.storage import FileSystemStorage
import os
import uuid
from django.utils.deconstruct import deconstructible

tree_images = FileSystemStorage(location="tree_library/")
usertree_images = FileSystemStorage(location="gina_trees/")


@deconstructible
class PathAndRename:
    def __init__(self, path):
        self.path = path

    def __call__(self, instance, filename):
        ext = filename.split('.')[-1]
        # Generate UUID-based filename
        filename = f"{uuid.uuid4().hex}.{ext}"
        return os.path.join(self.path, filename)
    
# Create your models here.
    
class TreeType(models.Model):
    type_name = models.CharField(max_length=100, primary_key=True)
    type_description = models.TextField(null=True, blank=True)

def get_default_type():
    return TreeType.objects.get_or_create(type_name="default")

class TreeInfo(models.Model):
    tree_type = models.ForeignKey("TreeType", default=get_default_type, on_delete=models.SET_DEFAULT)
    tree_description = models.TextField(null=True, blank=True)
    tree_name = models.CharField(max_length=100, primary_key=True)
    tree_image = models.ImageField(upload_to='tree_library/', null=True, blank=True)
    scientific_name = models.CharField(max_length=100, unique=True)
    family_name = models.CharField(max_length=100)

class UserInfo(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, to_field="username")
    first_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100, null=False)
    contact = models.CharField(max_length=20, null=True, blank=True)
    profile_picture = models.URLField(max_length=200, null=True, blank=True)
    user_points = models.PositiveIntegerField(default=0)

TREE_STATUS = [
    ("ORD", "Ordered"),
    ("SHP", "Shipped"),
    ("DLV", "Delivered"),
    ("PLT", "Planted"),
    ("IDE", "Identified")
]

class UserTreeInfo(models.Model):
    reference_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    planted_on = models.DateTimeField(auto_now_add=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    model_tree = models.ForeignKey("TreeInfo", on_delete=models.SET_NULL, null=True, to_field="tree_name")
    owning_user = models.ForeignKey("UserInfo", on_delete=models.SET_NULL, null=True, to_field="user")
    tree_name = models.CharField(max_length=100, null=False, blank=False)
    tree_type = models.CharField(max_length=100, null=True, blank=True)
    tree_description = models.TextField(null=False, blank=False)
    action = models.CharField(max_length=100, null=False, blank=False)
    quantity = models.IntegerField()
    status = models.CharField(choices=TREE_STATUS)
    image = models.ImageField(upload_to=PathAndRename('gina_trees/'), null=True, blank=True,)


class IdentifyTreeInfo(models.Model):
    tree_identifier = models.ForeignKey("UserTreeInfo", on_delete=models.SET_NULL, null=True, to_field="reference_id")
    tree_comment = models.TextField(null=False, blank=False)
    identified_on = models.DateTimeField(auto_now_add=True)
    identified_by = models.ForeignKey("UserInfo", on_delete=models.SET_NULL, null=True, to_field="user")


class UserTreeArchive(models.Model):
    reference_id = models.ForeignKey("UserTreeInfo", on_delete=models.SET_NULL, null=True, to_field="reference_id")
    owning_user = models.ForeignKey("UserInfo", on_delete=models.SET_NULL, null=True, to_field="user")
    tree_name = models.CharField(max_length=100, null=False, blank=False)
    tree_type = models.CharField(max_length=100, null=True, blank=True)
    tree_description = models.TextField(null=False, blank=False)
    planted_on = models.DateTimeField(auto_now_add=True)
    image = models.ImageField(upload_to=PathAndRename('gina_trees/'), null=True, blank=True,)
    