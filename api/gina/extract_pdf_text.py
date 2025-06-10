import sys
from pathlib import Path
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
# Dcoumentation link: https://pymupdf.readthedocs.io/en/latest/recipes-text.html

doc = pymupdf.open("native-trees.pdf")

print("tree_name,scientific_name,family_name")

for page_num in range(25,127,2):
    plant = doc[page_num]

    find = plant.get_text("blocks")

    # extract the text from the block
    words = str(find[4][4])

    # debug commands
    # print(find[4])

    # remove space and line separators
    # for given name , scientific name,
    # and family name in that order
    words = re.sub("\s[\s\n]+","\n",words)

    words = words.split("\n")
    words = [w for w in words if w != ""]
    # print(words)

    for i, word in enumerate(words):
        #  only extract the scientific name
        #  and family name. Exclude the
        #  name of person who discovered
        #  the plant
        if i == 0:
            temp = word
        if i == 1:
            genus,species, *rest = word.split(" ")
            temp = genus + " " + species
        if i == 2:
            family, * rest = word.split(" ")
            temp = family
        
        temp = re.sub("^\s+","",temp)
        temp = re.sub("\s+$","",temp)

        if i < len(words) - 1 and temp != "":
            print(temp,end=",")
        elif page_num == 125:
            print(temp,end="")
        else:
            print(temp)


