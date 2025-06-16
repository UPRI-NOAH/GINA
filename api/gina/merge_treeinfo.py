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

csv_1_file_path = 'api/gina/treeinfo.csv'
df1 = pd.read_csv(csv_1_file_path)
csv_2_file_path = 'api/gina/treeinfo-partial.csv'
def2 = pd.read_csv(csv_2_file_path)

#print the header for new csv
print("tree_name,image,scientific_name,family_name,tree_description")

scientific_names = 

for index, row in df.iterrows():
    