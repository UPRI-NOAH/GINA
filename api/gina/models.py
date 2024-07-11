import uuid
from django.db import models

# Create your models here.

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
