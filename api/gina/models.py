import uuid
from django.db import models
from django.forms import DateField

# Create your models here.
    
class TreeType(models.Model):
    type_name = models.CharField(max_length=100, primary_key=True)
    type_description = models.TextField(null=True, blank=True)

def get_default_type():
    return TreeType.objects.get_or_create(type_name="default")

class TreeInfo(models.Model):
    tree_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tree_type = models.ForeignKey("TreeType", default=get_default_type, on_delete=models.SET_DEFAULT)
    tree_description = models.TextField(null=True, blank=True)
    tree_name = models.CharField(max_length=100)
    tree_image = models.URLField(max_length=200, null=True, blank=True)
    scientific_name = models.CharField(max_length=100, unique=True)
    family_name = models.CharField(max_length=100)

class UserInfo(models.Model):
    user_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=100, null=False, unique=True)
    first_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100, null=False)
    email = models.CharField(max_length=100, null=True, unique=True)
    password = models.CharField(max_length=100, null=False)
    contact = models.CharField(max_length=20, null=True, blank=True)
    profile_picture = models.ImageField(upload_to='images/', default=None, null=True, blank=True)
    # gallery = 
    user_points = models.PositiveIntegerField(default=0)

TREE_STATUS = [
    ("ORD", "Ordered"),
    ("SHP", "Shipped"),
    ("DLV", "Delivered"),
    ("PLT", "Planted")
]

class UserTreeInfo(models.Model):
    reference_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    planted_on = DateField()
    planted_at
    owning_user
    quantity
    status