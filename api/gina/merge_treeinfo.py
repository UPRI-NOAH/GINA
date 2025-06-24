import sys
import pandas as pd
from pathlib import Path
from enum import Enum
import requests
import os
import re

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.append(str(PROJECT_ROOT))

# HOW TO USE 
# Run the command below on your command shell:
# python api/gina/merge_tree_info.py > api/gina/treeinfo-new.csv
# Once the CSV file looks good, only then replace 
# the old CSV file into treeinfo-old.csv
# and the current output as treeinfo.csv

csv_1_file_path = 'api/gina/treeinfo-old.csv'
df1 = pd.read_csv(csv_1_file_path)
csv_2_file_path = 'api/gina/treeinfo-partial.csv'
df2 = pd.read_csv(csv_2_file_path)

#print the header for new csv
print("tree_name,image,scientific_name,family_name,tree_description")

scientific_names = [str(row['scientific_name']).upper() for index, row in df2.iterrows()]

def print_treeinfo(row):
    empty_info = "\" \""
    tree_name = empty_info if pd.isnull(row['tree_name']) else row['tree_name']
    image = empty_info if pd.isnull(row['image']) else row['image']
    scientific_name = empty_info if pd.isnull(row['scientific_name']) else row['scientific_name']
    family_name = empty_info if pd.isnull(row['family_name']) else row['family_name']
    description = empty_info if pd.isnull(row['tree_description']) else row['tree_description']

    scientific_name = "".join(name.lower()[0].upper() + name.lower()[1:] + "," for name in scientific_name.split(", "))
    scientific_name = re.sub(",$","",scientific_name)

    if scientific_name.count(',') > 0:
        scientific_name = "\"" + scientific_name + "\""

    if description.count(',') > 0:
        description = "\"" + description + "\""

    print(f"{tree_name},{image},{scientific_name},{family_name},{description}")

for index, row in df2.iterrows():

    for index_2, row_2 in df1.iterrows():
        key = 'scientific_name'
        if row_2[key] in row[key] or row[key] in row_2[key]:
            if not pd.isnull(row_2['image']):
                row['image'] = row_2['image']
            if not pd.isnull(row_2['tree_description']):
                row['tree_description'] = row_2['tree_description']
            break

    print_treeinfo(row)

for index, row in df1.iterrows():
    
    scientific_name = row['scientific_name'].upper()
   
    found_name = False

    for name in scientific_names:
        if scientific_name in name or name in scientific_name:
            found_name = True
            break

    if not found_name:
        print_treeinfo(row)