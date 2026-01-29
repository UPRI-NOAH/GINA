from django.core.cache import cache
from rest_framework.throttling import BaseThrottle
from rest_framework.response import Response
from rest_framework import status

class FailedLoginThrottle(BaseThrottle):
    """
    Blocks login after X failed attempts per username + IP
    """
    rate = 5  # max failed attempts
    timeout = 60  # seconds to lock out

    def allow_request(self, request, view):
        username = request.data.get("username")
        if not username:
            return True  # can't throttle if username not provided

        ident = self.get_ident(request)
        cache_key = f"failed_login:{username}:{ident}"
        attempts = cache.get(cache_key, 0)

        if attempts >= self.rate:
            return False  # block login

        return True

    def increment(self, request):
        username = request.data.get("username")
        ident = self.get_ident(request)
        cache_key = f"failed_login:{username}:{ident}"
        attempts = cache.get(cache_key, 0)
        cache.set(cache_key, attempts + 1, timeout=self.timeout)

    def reset(self, request):
        username = request.data.get("username")
        ident = self.get_ident(request)
        cache_key = f"failed_login:{username}:{ident}"
        cache.delete(cache_key)