import pandas as pd
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

    userTreeInfo = UserTreeInfo(
        planted_on=row['date_inserted'][:10],
        longitude=row['lng'],
        latitude=row['lat'],
        model_tree=TreeInfo.objects.get(tree_name=row['name']),
        owning_user=userInfo,
        quantity=row['qty'],
        status='PLT',
        image=row['photo'].replace('/user_upload/', '').replace('user_upload/', ''),
    )

    userTreeInfo.save()

print("CSV data has been loaded into the Django database.")