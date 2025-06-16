import sys
from pathlib import Path
from enum import Enum
import os
import re

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.append(str(PROJECT_ROOT))

# cat the file
# append the image column
# append unique entries to treeinfo.csv 
# save it as different csv for testing

header = input().split(",")
tree_name = header[0]
scientific_name = header[1]
family_name = header[2] 

print(f"{tree_name},image,{scientific_name},{family_name}")
