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

for tree in tree_list:

    treeType, created = TreeType.objects.get_or_create(
        type_name='default',
    )

    treeInfo = TreeInfo(
        tree_name=tree['tree_name'],
        tree_image=tree['tree_image'],
        scientific_name=tree['scientific_name'],
        family_name=tree['family_name'],
        tree_type=treeType,
    )
    
    treeInfo.save()

print("Binhi data has been loaded into the Django database.")