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

doc = pymupdf.open("native-trees.pdf")

page_num = 25

find = doc.get_page_images(page_num)

for img in find:
    extracted = doc.extract_image(img[0])
    print("ext: ",extracted['ext'],"width: ",extracted['width'],"height: ",extracted['height'])
    pil_image = Image.open(io.BytesIO(extracted['image']), mode='r')

    pil_image.show()