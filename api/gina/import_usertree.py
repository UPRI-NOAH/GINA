import pandas as pd
import sys
from pathlib import Path
import os
import django
from django.utils.dateparse import parse_datetime
from django.utils.timezone import make_aware, is_naive
import urllib.parse

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.append(str(PROJECT_ROOT))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api.settings")  # noqa: E402, E501
django.setup()

from django.contrib.auth.models import User
from api.gina.models import UserInfo, TreeInfo, UserTreeInfo

csv_file_path = 'api/gina/usertree.csv'
df = pd.read_csv(csv_file_path)

for index, row in df.iterrows():
    user, created = User.objects.get_or_create(
        username='Anonymous',
    )

    userInfo, created = UserInfo.objects.get_or_create(
        user=user,
        defaults={'last_name': 'N/A'}
    )

    raw = row['date_inserted']
    clean = urllib.parse.unquote(str(raw)).strip()  # handle %3A and \r\n
    dt = parse_datetime(clean)

    if dt is None:
        print(f"⚠️ Skipping row {index}: invalid datetime '{raw}'")
        continue

    if is_naive(dt):
        dt = make_aware(dt)

    userTreeInfo = UserTreeInfo(
        planted_on=dt,
        longitude=row['lng'],
        latitude=row['lat'],
        # model_tree=TreeInfo.objects.get(tree_name=row['name']),
        owning_user=userInfo,
        tree_name=row['name'],
        tree_description=row['details'],
        quantity=row['qty'],
        status='PLT',
        action='Planted',
        image=row['photo'].replace('/user_upload/', 'gina_trees/').replace('user_upload/', 'gina_trees/'),
    )

    userTreeInfo.save()

print("CSV data has been loaded into the Django database.")