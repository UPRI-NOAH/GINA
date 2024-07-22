from django.contrib import admin
from api.gina.models import TreeInfo, TreeType, UserInfo, UserTreeInfo

# Register your models here.
admin.site.register(TreeInfo)
admin.site.register(TreeType)
admin.site.register(UserInfo)
admin.site.register(UserTreeInfo)
