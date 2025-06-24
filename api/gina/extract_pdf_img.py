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
# 1. Create the folder api/gina/output-images
# 2. Execute this command on your shell:
#    python api/gina/extract_pdf_img.py < api/gina/treeinfo-partial.csv
#    the result is saved at api/gina/<img_folder>

# pymupdf is used for image extraction
# Video tutorial: https://www.youtube.com/watch?v=C7U1BZV5SjM&t=160s
# Documentation: https://pymupdf.readthedocs.io/en/latest/recipes-images.html

dimlimit = 0  # 100  # each image side must be greater than this
relsize = 0  # 0.05  # image : image size ratio must be larger than this (5%)
abssize = 0  # 2048  # absolute image size limit 2 KB: ignore if smaller
img_folder = "output-images"  # found images are stored in this folder
IMG_DIR_PATH = "api/gina/" + img_folder

# function snippet taken from 
# https://github.com/pymupdf/PyMuPDF-Utilities/blob/master/examples/extract-images/extract-from-pages.py
def recoverpix(doc, item):
    xref = item[0]  # xref of PDF image
    smask = item[1]  # xref of its /SMask

    # special case: /SMask or /Mask exists
    if smask > 0:
        pix0 = pymupdf.Pixmap(doc.extract_image(xref)["image"])
        if pix0.alpha:  # catch irregular situation
            pix0 = pymupdf.Pixmap(pix0, 0)  # remove alpha channel
        mask = pymupdf.Pixmap(doc.extract_image(smask)["image"])

        try:
            pix = pymupdf.Pixmap(pix0, mask)
        except:  # fallback to original base image in case of problems
            pix = pymupdf.Pixmap(doc.extract_image(xref)["image"])

        if pix0.n > 3:
            ext = "pam"
        else:
            ext = "png"

        return {  # create dictionary expected by caller
            "ext": ext,
            "colorspace": pix.colorspace.n,
            "image": pix.tobytes(ext),
        }

    # special case: /ColorSpace definition exists
    # to be sure, we convert these cases to RGB PNG images
    if "/ColorSpace" in doc.xref_object(xref, compressed=True):
        pix = pymupdf.Pixmap(doc, xref)
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
        return {  # create dictionary expected by caller
            "ext": "png",
            "colorspace": 3,
            "image": pix.tobytes("png"),
        }
    return doc.extract_image(xref)

doc = pymupdf.open("native-trees.pdf")

if not os.path.exists(IMG_DIR_PATH):
    os.mkdir(IMG_DIR_PATH)

headers = input()
#print(headers)

names = []

for tree in range(25,127,2):

    given_name,scientific_name,family_name = input().split(",")
    scientific_name = re.sub("\s","-",scientific_name)
    names.append(scientific_name)

xreflist = []
imglist = []
for page_num in range(25,127,2):

    tree_images = doc.get_page_images(page_num)
    name_index = (page_num - 25) // 2
    name = names[name_index]

    # snippet modified from 
    # https://github.com/pymupdf/PyMuPDF-Utilities/blob/master/examples/extract-images/extract-from-pages.py
    il = doc.get_page_images(page_num)
    imglist.extend([x[0] for x in il])

    for i, img in enumerate(il):

        # never extract the background image (first one)
        # and the image with no plant (last one)
        if 0 < i < (len(il) - 1):
            image = recoverpix(doc, img)
            n = image["colorspace"]
            imgdata = image["image"]

            # save the image to the folder
            imgfile = os.path.join(imgdir, "%s.%s" % (name+"-"+str(i), image["ext"]))
            fout = open(imgfile, "wb")
            fout.write(imgdata)
            fout.close()

    # optional debug message
    print(f"Image for {name} saved.")

print("Extracting images in native_trees.pdf done.")