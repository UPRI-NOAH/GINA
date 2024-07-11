import os
from distutils.util import strtobool

def get_str(var_name, default=None):
    return os.getenv(var_name) or default