mport sys
from pathlib import Path
from enum import Enum
import requests
import os
import re

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.append(str(PROJECT_ROOT))

# cat the csv file
# match header with treeinfo.csv
# find all scientific names
# filter all unique ones
# append the unique ones to a new csv file
# for testing 