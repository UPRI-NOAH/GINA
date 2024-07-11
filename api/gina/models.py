import uuid
from django.db import models

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