import pandas as pd
import sys
from pathlib import Path
import django
import requests
import os
import pymupdf
import re

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.append(str(PROJECT_ROOT))

doc = pymupdf.open("native-trees.pdf")

#get PDF metadata
#print(doc.metadata)

# get page 42 of the PDF file
plant = doc[41]

find = plant.get_text("blocks")

# extract the text from the block
words = str(find[4][4])

# debug commands
# print(find[4])

# remove space and line separators
# for given name , scientific name,
# and family name in that order
words = re.sub("\s[\s\n]+","\n",words)

# remove family name description
words = re.sub("\([A-Za-z\s]+\)","",words)

words = words.split("\n")
words = [w for w in words if w != ""]
print(words)

for i, word in enumerate(words):
    #  only extract the scientific name
    #  and family name. Exclude the
    #  name of person who discovered
    #  the plant
    if i == 1:
        w1,w2,w3 = word.split(" ")
        temp = w1 + " " + w2
    else:
        temp = word
    temp = re.sub("\s+$","",temp)
    if i < len(words) - 1:
        print(temp,end=",")
    else:
        print(temp)


