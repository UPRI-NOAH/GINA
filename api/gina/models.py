import uuid
from django.db import models

# Create your models here.
class TreeInfo(models.Model):
    tree_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tree_type = models.CharField(max_length=100, null=False)
    tree_description = models.TextField()
    tree_name = models.CharField(max_length=100, null=False)
    scientific_name = models.CharField(max_length=100, null=False, unique=True)
    family_name = models.CharField(max_length=100, null=False)