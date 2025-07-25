import sys
from pathlib import Path
from enum import Enum
import django
import requests
import os
import pymupdf
import re

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.append(str(PROJECT_ROOT))

# TO USE:
# Execute this command on your shell:
# python api/gina/extract_pdf_text.py > api/gina/treeinfo-partial.csv
# the result is saved at api/gina/treeinfo-partial.csv

# Pymupdf is the library used for text extraction
# Tutorial video: https://www.youtube.com/watch?v=DSsqzKA_hPg&t=41s
# Documentation link: https://pymupdf.readthedocs.io/en/latest/recipes-text.html

class TreeInfoEnum(Enum):
    GIVEN_NAME = 0
    SCIENTIFIC_NAME = 1
    FAMILY_NAME = 2
    DESCRIPTION = 3

# variables for extracting text from pdf
page_start = 25
page_end = 125
step = 2
PAGES = range(page_start,page_end+step,step)
PDF_FILE = "api/gina/pdf/native-trees.pdf"
CSV_HEADER = "tree_name,image,scientific_name,family_name,tree_description"

doc = pymupdf.open(PDF_FILE)

print(CSV_HEADER)

for page_num in PAGES:
    plant = doc[page_num]

    find = plant.get_text("blocks")

    # extract the text from the block
    words = str(find[4][4])

    # remove space and line separators
    # for given name , scientific name,
    # and family name in that order
    words = re.sub("\s[\s\n]+","\n",words)

    words = words.split("\n")
    words = [w for w in words if w != ""]

    for i, word in enumerate(words):
        #  only extract the scientific name
        #  and family name.
        if i == TreeInfoEnum.GIVEN_NAME.value:
            temp = word
        if i == TreeInfoEnum.SCIENTIFIC_NAME.value:
            genus,species, *rest = word.split(" ")
            temp = genus + " " + species
        if i == TreeInfoEnum.FAMILY_NAME.value:
            family, * rest = word.split(" ")
            temp = family
        
        temp = re.sub("^\s+","",temp)
        temp = re.sub("\s+$","",temp)

        # include empty image row comma
        if i == TreeInfoEnum.GIVEN_NAME.value:
            print(temp,end=",,")
        else:
            print(temp,end=",")
    
    tree_description = ""
    for entry in range(5,len(find)):
        text = find[entry][4]
        tree_description += text
        if re.match("Propagation",text):
            break
    
    tree_description = re.sub("[\s\n]+"," ",tree_description)
    tree_description = re.sub("^\s","",tree_description)
    print(f"\"{tree_description}\"",end="")

    if page_num != page_end:
        print("\n",end="")