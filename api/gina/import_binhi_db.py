import pandas as pd
import sys
from pathlib import Path
import django
import requests
import os
from bs4 import BeautifulSoup

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.append(str(PROJECT_ROOT))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api.settings")  # noqa: E402, E501
django.setup()
from api.gina.models import TreeType, TreeInfo
from django.core.files import File

dir_path = os.getcwd()

tree_library = os.path.join(dir_path, "tree_library")  # noqa: E501
os.makedirs(tree_library, exist_ok=True)

base_url = "https://binhi.ph/trees-results/"

attachments_response = requests.get(base_url)
soup = BeautifulSoup(attachments_response.text, 'html.parser')

tree_list = []
common_name_list = []
common_name = soup.find_all("p", {"class": "common_name"})

for i in common_name:
    c_name_dict = {}
    c_names = str(i).replace('<p class="common_name">', '').replace('</p>', '')
    c_name_dict["tree_name"] = c_names

    jpg_file = f"{c_names}.jpg"
    jpg_file = jpg_file.replace(" ", "-")

    if "/" in jpg_file:
        jpg_file = jpg_file.replace("/", "-")

    c_name_dict["tree_image"] = f"tree_library/{jpg_file}"
    
    tree_list.append(c_name_dict)

sci_name = soup.find_all("p", {"class": "sci_name"})
for idx, x in enumerate(sci_name):
    s_names = str(x).replace('<p class="sci_name">', '').replace('</p>', '')
    tree_list[idx]["scientific_name"] = s_names
    

for idx, a in enumerate(soup.select("a[href*=tree-name]")):
    href = a['href']
    tree_profile_url = f"https://binhi.ph/{href}"
    req_tree_profile = requests.get(tree_profile_url)
    souper = BeautifulSoup(req_tree_profile.text, 'html.parser')
    mydivs = souper.find("div", {"class": "value__fam"})
    f_name = str(mydivs).replace('<div class="value__fam">', '').replace('</div>', '')
    tree_list[idx]["family_name"] = f_name

## GINA11 -- extracting tree description from binhi.ph 

for idx, b in enumerate(soup.select("a[href*=tree-name]")):
    href = b['href']
    tree_profile_url = f"https://binhi.ph/{href}"
    req_tree_profile = requests.get(tree_profile_url, verify=False) #get the url of each tree in database
    souper = BeautifulSoup(req_tree_profile.text, 'html.parser')
    
    content_section = souper.find(id="content1")    # finds the section of the page with id=content1
    desc_blocks = []    # creates a empty list 
    if content_section:
        desc_blocks = content_section.find_all("div", class_="bot__desc")   # fill list with all div with class = bot__desc
    desc_texts = [] # creates a initial empty list for descriptions
    for desc in desc_blocks:
        logo_text = None
        prev = desc.find_previous_sibling("div", class_="bot__logo")    # find the previous sibling of the description (which will be the logo of each specific description in the website)
        if prev:
            logo_div = prev.find("div", class_="bot__logo_text")    # if found, find the child div with class = bot__logo_text, this will be the label of each description (e.g. Bark, Leaf, Flower)
        else:
            None  
        if logo_div:
            logo_text = logo_div.get_text(strip=True)   # if there is a label (bot__logo_text is found), this will serve as the first label (which is initally the Bark)
        else:
            None
    
        desc_content = desc.get_text(strip=True)    # get the text of the nth desc in desc_blocks
        if logo_text and desc_content:
            desc_texts.append(f"{logo_text}: {desc_content}")   # assign the logo_text to its corresponding desc text (desc_content)
        elif desc_content:
            None
    
    if desc_texts:
        tree_list[idx]["tree_description"] = "\n ".join(desc_texts) # combine all desc_texts of each tree description
    else:
        tree_list[idx]["tree_description"] = "No description available" # if there is no tree descriptions

##

for tree in tree_list:

    treeType, created = TreeType.objects.get_or_create(
        type_name='default',
    )

    treeInfo = TreeInfo(
        tree_name=tree['tree_name'],
        tree_description=tree['tree_description'],
        tree_image=tree['tree_image'],
        scientific_name=tree['scientific_name'],
        family_name=tree['family_name'],
        tree_type=treeType,
    )
    
    treeInfo.save()

print("Binhi data has been loaded into the Django database.")