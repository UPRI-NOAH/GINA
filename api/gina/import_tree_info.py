from django.db import models
import pandas as pd
import sys
from pathlib import Path
import os
import django

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.append(str(PROJECT_ROOT))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api.settings")  # noqa: E402, E501
django.setup()
from api.gina.models import TreeType, TreeInfo

csv_file_path = 'api/gina/treeinfo.csv'
df = pd.read_csv(csv_file_path)

for index, row in df.iterrows():
    treeType, created = TreeType.objects.get_or_create(
        type_name='default',
    )
    img_fname = row['tree_name']+'.png'
    defaults = {"tree_description" : row['tree_description']}
    create_defaults = {
        "family_name": row['family_name'], 
        "tree_image": "tree_library/" + img_fname,
        "tree_description" : row['tree_description'],
        "tree_type" : treeType,
        "source" : "Forest Foundation Philippines",
    }
    try:
        treeinfo = TreeInfo.objects.get( 
            scientific_name=row['scientific_name'])
        for key, value in defaults.items():
            setattr(treeinfo, key, value)
        treeinfo.save()
        
    except TreeInfo.DoesNotExist:
        new_values = {
            "tree_name": row['tree_name'], 
            "scientific_name": row['scientific_name']
        }
        new_values.update(create_defaults)
        treeinfo = TreeInfo(**new_values)
        treeinfo.save()

print("CSV data has been loaded into the Django database.")