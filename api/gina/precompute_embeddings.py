import pandas as pd
import sys
from pathlib import Path
import os
import django
import traceback

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.append(str(PROJECT_ROOT))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api.settings")  # noqa: E402, E501
django.setup()

from django.contrib.auth.models import User
from api.gina.models import TreeInfo, UserTreeArchive
from api.gina.tree_image_utils import get_image_embedding


def precompute_user_treearchiveinfo_embeddings():
    user_acrhive_trees = UserTreeArchive.objects.exclude(image='').filter(image_embedding__isnull=True)
    print(f"UserTreeInfo without embeddings: {user_acrhive_trees.count()}")

    for tree in user_acrhive_trees:
        try:
            embedding = get_image_embedding(tree.image)
            tree.image_embedding = embedding.tolist()
            tree.save(update_fields=['image_embedding'])
            print(f"Saved embedding for UserTreeInfo {tree.reference_id}")
        except Exception as e:
            print(f"Failed UserTreeInfo {tree.reference_id}: {e}")
            print(traceback.format_exc())

def precompute_treeinfo_embeddings():
    trees = TreeInfo.objects.exclude(tree_image='').filter(image_embedding__isnull=True)
    print(f"TreeInfo without embeddings: {trees.count()}")

    for tree in trees:
        try:
            embedding = get_image_embedding(tree.tree_image)
            tree.image_embedding = embedding.tolist()
            tree.save(update_fields=['image_embedding'])
            print(f"Saved embedding for TreeInfo {tree.tree_name}")
        except Exception as e:
            print(f"Failed TreeInfo {tree.tree_name}: {e}")
            print(traceback.format_exc())

if __name__ == '__main__':
    precompute_user_treearchiveinfo_embeddings()
    precompute_treeinfo_embeddings()