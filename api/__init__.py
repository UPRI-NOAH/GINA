import os
from distutils.util import strtobool
from api.gina.celery_app import app as celery_app

__all__ = ['celery_app']

def get_str(var_name, default=None):
    return os.getenv(var_name) or default