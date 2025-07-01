from django.urls import re_path
from api.gina.consumers import TreeNotifConsumer

websocket_urlpatterns = [
    re_path(r'ws/tree-notifications/$', TreeNotifConsumer.as_asgi()),
]