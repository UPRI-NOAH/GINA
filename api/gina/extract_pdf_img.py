import sys
from pathlib import Path
from PIL import Image
import io
import requests
import os
import pymupdf
import re

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.append(str(PROJECT_ROOT))

# TO USE:
# 1. Create the folder api/gina/images
# 2. Execute this command on your shell:
#    python api/gina/extract_pdf_img.py < api/gina/treeinfo-partial.csv
#    the result is saved at api/gina/images

# pymupdf is used for image extraction
# Video tutorial: https://www.youtube.com/watch?v=C7U1BZV5SjM&t=160s
# Documentation: https://pymupdf.readthedocs.io/en/latest/recipes-images.html

doc = pymupdf.open("native-trees.pdf")

headers = input()
print(headers)

names = []

for tree in range(25,127,2):
    given_name,scientific_name,family_name = input().split(",")
    scientific_name = re.sub("\s","-",scientific_name)
    names.append(scientific_name)

for page_num in range(25,127,2):
    tree_images = doc.get_page_images(page_num)
    name_index = (page_num - 25) // 2
    name = names[name_index]
    for i, image in enumerate(tree_images):
        extracted = doc.extract_image(image[0])
        pil_image = Image.open(io.BytesIO(extracted['image']))
        pil_image.save(f"api/gina/images/{name}-{i}.png")
    print(f"Image for {name} saved.")

print("Extracting images in native_trees.pdf done.")