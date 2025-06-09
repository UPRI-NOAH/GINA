import numpy as np
from PIL import Image
import torch
import torchvision.transforms as transforms
from torchvision.models import mobilenet_v2, MobileNet_V2_Weights
from sklearn.metrics.pairwise import cosine_similarity
from rest_framework import serializers  # for raising DRF validation error

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
