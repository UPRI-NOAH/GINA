import pandas as pd
from api.gina.models import TreeType, TreeInfo

csv_file_path = 'api/gina/treeinfo.csv'
df = pd.read_csv(csv_file_path)

for index, row in df.iterrows():
    treeType, created = TreeType.objects.get_or_create(
        type_name='default',
    )

    treeInfo = TreeInfo(
        tree_name=row['tree_name'],
        tree_image=row['image'],
        scientific_name=row['scientific_name'],
        family_name=row['family_name'],
        tree_type=treeType,
    )

    treeInfo.save()

print("CSV data has been loaded into the Django database.")