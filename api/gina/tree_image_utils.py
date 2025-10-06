import numpy as np
from PIL import Image
import torch
import torchvision.transforms as transforms
from torchvision.models import mobilenet_v2, MobileNet_V2_Weights
from sklearn.metrics.pairwise import cosine_similarity
from rest_framework import serializers  # for raising DRF validation error
from api.gina.models import UserTreeArchive
from api.gina.tasks import send_tree_reminder
from datetime import timedelta
from django.utils import timezone
import redis
from api.gina.celery_app import app as celery_app
from PIL import Image, ExifTags
import io
from django.core.files.base import ContentFile


redis_client = redis.StrictRedis(host='localhost', port=6379, db=0, decode_responses=True)

# Load MobileNetV2 with proper weights and remove classifier
weights = MobileNet_V2_Weights.DEFAULT
model = mobilenet_v2(weights=weights)
model.classifier = torch.nn.Identity()
model.eval()  # Evaluation mode

# Image preprocessing pipeline
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    weights.transforms()
])

@torch.no_grad()
def get_image_embedding(img_file):
    """
    Extract embedding from an image using PyTorch MobileNetV2.
    """
    img = Image.open(img_file).convert('RGB')
    img_tensor = transform(img).unsqueeze(0)  # Add batch dimension

    embedding = model(img_tensor)
    return embedding.squeeze().numpy()  # Return as 1D NumPy array

def check_image_similarity_against_embeddings(new_embedding, existing_trees, threshold=0.45):
    """
    Compare new embedding to stored image embeddings.
    """
    if isinstance(new_embedding, list):
        new_embedding = np.array(new_embedding)

    best_score = 0.0
    best_id = None

    for tree in existing_trees:
        existing_embedding = tree.image_embedding
        if not existing_embedding:
            continue

        try:
            existing_embedding = np.array(existing_embedding)
            score = cosine_similarity([new_embedding], [existing_embedding])[0][0]

            if score > best_score:
                best_score = score
                best_id = str(tree.reference_id) if hasattr(tree, "reference_id") else str(tree.tree_name)

        except Exception:
            continue

    return best_score >= threshold, best_score, best_id


def schedule_tree_reminder(tree):
    now = timezone.now()
    tree_age_days = (now - tree.planted_on).days
    interval_days = 180 if tree_age_days >= 1095 else 30
    
    # Get the last update time
    latest_archive = (
        UserTreeArchive.objects
        .filter(reference_id=tree.reference_id)
        .order_by('-planted_on')
        .first()
    )
    last_update = latest_archive.planted_on if latest_archive else tree.planted_on
    reminder_time = last_update + timedelta(days=interval_days)
    # reminder_time = now + timedelta(seconds=10) # For testing

    now = timezone.now()

    ttl_seconds = int((reminder_time - now).total_seconds())
    if ttl_seconds <= 0:
        # Reminder time {reminder_time} is in the past or too soon.
        return

    redis_key = f"tree_reminder_task:{str(tree.reference_id)}" # Register redis key to store in task
    old_task_id = redis_client.get(redis_key)

    if old_task_id:
        # Revoke tasks after updating tree
        celery_app.control.revoke(old_task_id, terminate=True)
        print(f"Revoked previous task ID {old_task_id}")

    task = send_tree_reminder.apply_async(
        args=[tree.owning_user.user.id, str(tree.reference_id), tree.tree_name],
        eta=reminder_time
    )

    redis_client.set(redis_key, task.id, ex=ttl_seconds)
    #  "Set Redis key {redis_key} = {task.id} for {ttl_seconds} seconds"


def compress_image(image):
    try:
        img = Image.open(image)

        # Handle EXIF orientation tag (auto-rotate)
        try:
            exif = img._getexif()
            if exif:
                orientation_key = next(
                    (k for k, v in ExifTags.TAGS.items() if v == 'Orientation'), None
                )
                if orientation_key and orientation_key in exif:
                    orientation = exif[orientation_key]
                    if orientation == 3:
                        img = img.rotate(180, expand=True)
                    elif orientation == 6:
                        img = img.rotate(270, expand=True)
                    elif orientation == 8:
                        img = img.rotate(90, expand=True)
        except Exception:
            pass  # If EXIF handling fails, just skip it

        # Convert to RGB if needed (JPEG requires RGB)
        if img.mode != 'RGB':
            img = img.convert('RGB')

        # Optional: Resize the image to a thumbnail size (you can adjust this as needed)
        # img.thumbnail((1024, 1024))

        # Create a buffer to save the compressed image
        buffer = io.BytesIO()

        # Save the image to the buffer in JPEG format with reduced quality
        img.save(buffer, format='JPEG', quality=60)

        # Seek to the beginning of the buffer after saving the image
        buffer.seek(0)

        return ContentFile(buffer.read(), name=image.name)

    except Exception as e:
        raise serializers.ValidationError(f"Invalid image: {str(e)}")
  