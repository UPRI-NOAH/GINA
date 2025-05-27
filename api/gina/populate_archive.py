import os
import django
from pathlib import Path
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.append(str(PROJECT_ROOT))
# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api.settings")  # noqa: E402, E501

django.setup()

from api.gina.models import UserTreeInfo, UserTreeArchive

def main():
    trees = UserTreeInfo.objects.all()

    for tree in trees:
        # Check for existing archive entry
        if not UserTreeArchive.objects.filter(
            reference_id=tree,
            tree_name=tree.tree_name,
            tree_type=tree.tree_type,
            tree_description=tree.tree_description,
            planted_on=tree.planted_on,
            image=tree.image
        ).exists():
            UserTreeArchive.objects.create(
                reference_id=tree,
                owning_user=tree.owning_user,
                tree_name=tree.tree_name,
                tree_type=tree.tree_type,
                tree_description=tree.tree_description,
                planted_on=tree.planted_on,
                image=tree.image,
            )
            print(f"Archived: {tree.tree_name}")
        else:
            print(f"Already archived: {tree.tree_name}")

    print("Done.")

if __name__ == "__main__":
    main()
