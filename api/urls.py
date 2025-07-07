"""api URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from api.gina.views import UserInfoViewset, UserTreeViewset, IdentifyTreeInfoViewset, UserTreeArchiveViewset, NotificationViewSet, CustomTokenCreateView, SaveSubscriptionView
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from api.gina.views import (TreeInfoViewset, TreeTypeViewset, 
                            activate_page, reset_password, unsubscribe, 
                            mark_all_notifications_seen, pass_tree_notif)

router = DefaultRouter()

router.register("user-info", UserInfoViewset, basename="user-info")
router.register("tree-info", TreeInfoViewset, basename="tree-info")
router.register("tree-type", TreeTypeViewset, basename="tree-type")
router.register("user-tree-info", UserTreeViewset, basename="user-tree-info")
router.register("identify-tree-info", IdentifyTreeInfoViewset, basename="identify-tree-info")
router.register("archive-tree-info", UserTreeArchiveViewset, basename="archive-tree-info")
router.register("notifications", NotificationViewSet, basename="notification")

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", include(router.urls)), 
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('activate.html', activate_page),
    path('reset_password.html', reset_password),
    path('auth/', include('djoser.urls')),
    # path('auth/', include('djoser.urls.authtoken')),
    path("subscribe/", SaveSubscriptionView.as_view(), name="save-subscription"),    
    path("unsubscribe/", unsubscribe, name="delete-subscription"),  
    path('notifications/mark_all_seen/', mark_all_notifications_seen, name='mark_all_seen'),
    path('auth/token/login/', CustomTokenCreateView.as_view(), name='custom_token_login'),
    path("api/tree-help/pass/<uuid:reference_id>/", pass_tree_notif),
    # path('api-auth/', include('rest_framework.urls')), # for local only

]

# for local
# ] +static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# if settings.DEBUG:
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
#     print(urlpatterns)