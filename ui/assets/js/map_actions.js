function checkInternetConnection() {
  return fetch('https://punla.up.edu.ph/api/', { method: 'HEAD', cache: 'no-cache' })
    .then(() => true)
    .catch(() => false);
}

// Utility: convert File (image) to base64 string
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Save offline tree data to localStorage
function saveTreeDataOffline(treeData) {
  const offlineTrees = JSON.parse(localStorage.getItem('offlineTrees') || '[]');
  offlineTrees.push(treeData);
  localStorage.setItem('offlineTrees', JSON.stringify(offlineTrees));
}

// Convert base64 dataURL to Blob (needed to upload after offline)
function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// Upload offline stored trees when back online
async function uploadOfflineTrees() {
  let offlineTrees = JSON.parse(localStorage.getItem('offlineTrees') || '[]');
  if (offlineTrees.length === 0) return;

  const uploadResults = await Promise.all(offlineTrees.map(async (tree, index) => {
    const formData = new FormData();
    formData.append('tree_name', tree.plantName);
    formData.append('tree_description', tree.description);
    formData.append('tree_type', tree.treeType);
    formData.append('action', tree.action || '');
    formData.append('longitude', tree.longitude);
    formData.append('latitude', tree.latitude);
    formData.append('quantity', 1);
    formData.append('status', "PLT");
    formData.append('owning_user', tree.username);
    formData.append('version', 1);

    const rejectedImages = [];
    const validBlobs = [];

    for (let i = 0; i < (tree.images || []).length; i++) {
      const base64 = tree.images[i];
      const blob = dataURLtoBlob(base64);

      const validateForm = new FormData();
      validateForm.append('image', blob, `offline-image-${i + 1}.jpg`);

      try {
        const res = await fetch(validateImage, {
          method: 'POST',
          body: validateForm
        });
        const result = await res.json();

        if (result.valid) {
          validBlobs.push(blob);
        } else {
          rejectedImages.push(`Image ${i + 1}`);
        }
      } catch (err) {
        console.warn(`Validation error for tree #${index + 1}, image ${i + 1}:`, err);
        rejectedImages.push(`Image ${i + 1} (error)`);
      }
    }

    if (validBlobs.length === 0) {
      return {
        success: false,
        index,
        error: 'All images rejected.',
        rejectedImages
      };
    }

    validBlobs.forEach((blob, i) => {
      formData.append('images', blob, `offline-valid-${i + 1}.jpg`);
    });

    try {
      const response = await fetch(usertreeURL, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${authToken}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData?.detail || 'Upload failed';
        return { success: false, index, error: errorMsg, rejectedImages };
      }

      return { success: true, index, rejectedImages };

    } catch (err) {
      return { success: false, index, error: err.message, rejectedImages };
    }
  }));

  // Summarize results
  const failed = uploadResults.filter(r => !r.success);
  const success = uploadResults.filter(r => r.success);

  if (success.length) {
    alert(`${success.length} tree(s) uploaded successfully.`);
    success.forEach(r => {
      if (r.rejectedImages.length > 0) {
        alert(`Tree #${r.index + 1}: ${r.rejectedImages.length} image(s) were rejected:\n${r.rejectedImages.join(', ')}`);
      }
    });
  }

  if (failed.length) {
    const errorMsg = failed.map(f => `Tree #${f.index + 1} – ${f.error}`).join('\n');
    alert(`Some tree(s) failed to upload:\n${errorMsg}`);
  }

  // Clear all offline trees once attempted
  localStorage.removeItem('offlineTrees');
  location.reload();
}


function isOnline() {
  return navigator.onLine;
}


function resizeImage(file, maxSize = 800) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = () => {
      img.src = reader.result;
    };
    reader.onerror = reject;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error("Canvas toBlob failed — could not create blob."));
          return;
        }

        const resizedReader = new FileReader();
        resizedReader.onload = () => resolve(resizedReader.result);
        resizedReader.onerror = reject;
        resizedReader.readAsDataURL(blob);
      }, 'image/jpeg', 1.0);
    };

    img.onerror = () => reject(new Error("Image failed to load"));
    reader.readAsDataURL(file);
  });
}


function uploadTree() {
  const plantName = document.getElementById('plant-name').value;
  const description = document.getElementById('description').value;
  const treeType = document.getElementById('tree-type').value;
  const images = FILES.map(f => f.file);
  const latitude = Number(document.getElementById('latitude').value).toFixed(6);
  const longitude = Number(document.getElementById('longitude').value).toFixed(6);
  const username = localStorage.getItem('username') || sessionStorage.getItem('username');
  if (isImageProcessing) {
    alert("Please wait for images to finish validating...");
    return;
  }
  showLoading();
  console.log(plantName, description, treeType,username)
  if (!plantName || !description || !treeType || images.length === 0) {
    hideLoading();
    alert("Please fill in all fields and upload a photo before submitting.");
    return;
  }

  const formData = new FormData();
  formData.append('tree_name', plantName);
  formData.append('tree_description', description);
  formData.append('tree_type', treeType);
  formData.append('action', picAction);
  formData.append('longitude', longitude);
  formData.append('latitude', latitude);
  formData.append('quantity', 1);
  formData.append('status', "PLT")
  formData.append('owning_user', username);
  formData.append('version', 1);

  images.forEach(img => {
    console.log(img)
    formData.append('images', img);
  });
  console.log(images)

  checkInternetConnection().then(isOnline => {
    if (!isOnline) {
      Promise.all(
        images.map(file => {
          if (!(file instanceof Blob)) {
            console.warn("Skipping invalid image file:", file);
            return Promise.resolve(null);  // or skip it completely if you prefer
          }
          return resizeImage(file);
        })
      ).then(resizedImages => {
        const offlineData = {
          plantName,
          description,
          treeType,
          images: resizedImages,  // array of base64 images
          latitude,
          longitude,
          username,
          timestamp: Date.now(),
          action: picAction
        };
        saveTreeDataOffline(offlineData);
        hideLoading();
        alert("You're offline. Your data has been saved and will upload automatically once you're back online.");

        // Reset form
        document.getElementById("uploadoverlay").classList.add("invis");
        document.getElementById("map").classList.remove("map-blurred");
        const plantNameEl = document.getElementById('plant-name');
        const descriptionEl = document.getElementById('description');
        const treeTypeEl = document.getElementById('tree-type');
        const latitudeEl = document.getElementById('latitude');
        const longitudeEl = document.getElementById('longitude');

        if (plantNameEl) plantNameEl.value = '';
        if (descriptionEl) descriptionEl.value = '';
        if (treeTypeEl) treeTypeEl.value = '';
        if (latitudeEl) latitudeEl.value = '';
        if (longitudeEl) longitudeEl.value = '';
      }).catch(err => {
        console.error('Error resizing images:', err);
        hideLoading();
        alert("Failed to process images for offline saving.");
      });
    } else {
      // Online upload
      fetch(usertreeURL, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${authToken}`,
        },
        body: formData
      })
      .then(async response => {
        if (!response.ok) {
          let errorText = 'Upload failed';
          try {
            const errorData = await response.json();
            console.error('Full error from backend:', errorData);

            if (errorData.detail) {
              errorText = errorData.detail;
            } else {
              const firstError = Object.values(errorData)[0];
              errorText = Array.isArray(firstError) ? firstError[0] : firstError || 'Unknown error';
            }
          } catch (e) {
            console.error('Error parsing JSON:', e);
            errorText = 'Error parsing server response.';
          }
          throw new Error(errorText);
        }
        return response.json();
      })
      .then(data => {
        alert("Tree uploaded successfully!");
        hideLoading();
        document.getElementById("map").classList.remove("map-blurred");
        document.getElementById("uploadoverlay").classList.add("invis");
        location.reload();
      })
      .catch(error => {
        console.error('Upload error:', error);
        hideLoading();
        alert(error.message || "An unknown error occurred.");
      });
    }
  });
}



function editTree() {
  const plantName = document.getElementById('edit-plant-name').value;
  const description = document.getElementById('edit-description').value;
  const treeType = document.getElementById('edit-tree-type').value;
  const action = document.getElementById('edit-action').value;
  const images = EDIT_FILES.map(f => f.file);
  const username = localStorage.getItem('username') || sessionStorage.getItem('username');
  const treeId = document.getElementById('edit-ref-id').value;
  if (isImageProcessing) {
    alert("Please wait for images to finish validating...");
    return;
  }
  showLoading();
  if (!plantName || !description || !treeId || !treeType) {
    hideLoading();
    alert("Please fill in all required fields before submitting.");
    return;
  }

  if (uploadStatus === 'monthly' && images.length === 0) {
    hideLoading();
    alert("Please fill in all required fields before submitting.");
    return;
  }

  const formData = new FormData();
  formData.append('tree_name', plantName);
  formData.append('tree_description', description);
  formData.append('tree_type', treeType);
  formData.append('action', action);
  formData.append('owning_user', username);
  console.log(uploadStatus)
  
  if (uploadStatus === 'monthly' && images.length > 0) {
    images.forEach(img => {
      formData.append('images', img); // Must match backend getlist('images')
    });
  }

  fetch(`${usertreeURL}${treeId}/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Token ${authToken}`,
    },
    body: formData
    })
    .then(async response => {
      if (!response.ok) {
        // Try to parse the error message from JSON body
        const errorData = await response.json().catch(() => null);
        let errorMessage = 'Failed to edit tree data.';
        if (errorData) {
          // DRF validation errors come as object with keys pointing to lists of errors
          if (typeof errorData === 'object') {
            // Flatten all error messages into one string
            errorMessage = Object.values(errorData)
              .flat()
              .join('\n');
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        }
        throw new Error(errorMessage);
      }
      return response.json();
    })
    .then(data => {
      alert("Tree updated successfully");

      document.getElementById("map").classList.remove("map-blurred");
      document.getElementById("uploadoverlay").classList.add("invis");
      hideLoading();
      location.reload();
    })
    .catch(error => {
      console.error(error);
      hideLoading();
      alert(error.message);
    });
}


function editExpertTree() {
  const plantName = document.getElementById('expert-plant-name').value;
  const treeType = document.getElementById('expert-tree-type').value;
  const username = localStorage.getItem('username') || sessionStorage.getItem('username');
  const treeId = document.getElementById('expert-ref-id').value;

  showLoading();

  if (!plantName || !treeId || !treeType) {
    hideLoading();
    alert("Please fill in all required fields before submitting.");
    return;
  }

  const formData = new FormData();
  formData.append('tree_name', plantName);
  formData.append('tree_type', treeType);
  formData.append('edited_by', username);
  formData.append('action', "Expert");

  fetch(`${usertreeURL}${treeId}/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Token ${authToken}`,
    },
    body: formData
    })
    .then(async response => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        let errorMessage = 'Failed to edit tree data.';
        if (errorData) {
          if (typeof errorData === 'object') {
            errorMessage = Object.values(errorData)
              .flat()
              .join('\n');
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        }
        throw new Error(errorMessage);
      }
      return response.json();
    })
    .then(data => {
      alert("Tree updated successfully");

      document.getElementById("map").classList.remove("map-blurred");
      document.getElementById("uploadoverlay").classList.add("invis");
      hideLoading();
      location.reload();
    })
    .catch(error => {
      console.error(error);
      hideLoading();
      alert(error.message);
    });
}


function commentIdentify() {

  showLoading();
  const commentText = document.querySelector('textarea[name="body"]').value;
  const referenceId = document.getElementById("identify-ref-id").value; // adjust if stored differently
  const username = localStorage.getItem("username") || sessionStorage.getItem("username");
  
  if (!username) {
    hideLoading()
    alert("Please log in first before commenting.");
    window.location.href = 'login.html';
    return;
  }

  if (!commentText) {
    hideLoading()
    alert("Please input text");
    return;
  }
  
  const formData = new FormData();
  formData.append("tree_comment", commentText);
  formData.append("tree_identifier", referenceId);
  formData.append("identified_by", username);

  fetch(identifyTreeURL, {
    method: "POST",
    headers: {
      'Authorization': `Token ${authToken}`,
    },
    body: formData
  })
  .then(response => {
    if (!response.ok) throw new Error("Failed to post comment");
    return response.json();
  })
  .then(data => {
    hideLoading()
    document.querySelector('textarea[name="body"]').value = "";
    showComments(referenceId);
  })
  .catch(err => {
    console.error(err);
    alert("Failed to post comment.");
  });

  }


  function editComment(commentId, referenceId, buttonElement) {
    const commentCard = buttonElement.closest('.comment-card');
    const commentTextP = commentCard.querySelector('p.text-gray-600');
    const originalText = commentTextP.textContent;

    // Replace paragraph with textarea
    const textarea = document.createElement('textarea');
    textarea.className = 'w-full border p-2 rounded';
    textarea.value = originalText;

    // Replace content
    commentTextP.replaceWith(textarea);

    // Hide edit/delete buttons
    buttonElement.style.display = 'none';
    const deleteBtn = commentCard.querySelector('button.text-red-500');
    if (deleteBtn) deleteBtn.style.display = 'none';

    // Create Save/Cancel buttons
    const btnContainer = document.createElement('div');
    btnContainer.className = 'mt-2 flex gap-2';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.className = 'bg-green-500 text-white px-3 py-1 rounded';
    saveBtn.onclick = function () {
      const newText = textarea.value.trim();
      if (newText === '') return alert('Comment cannot be empty');

      const originalText = commentTextP.textContent;

      if (originalText === newText) {
        const originalP = document.createElement('p');
        originalP.className = 'text-gray-600 mt-2';
        originalP.textContent = originalText;
        textarea.replaceWith(originalP);
        btnContainer.remove();
        // Restore edit and delete buttons
        if (deleteBtn) deleteBtn.style.display = '';
        buttonElement.style.display = '';

        return; // Don't proceed with PATCH
      }
      else{
      // Send PATCH request
      fetch(`${identifyTreeURL}${commentId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ tree_comment: newText })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to update comment');
        }
        return response.json();
      })
      .then(data => {
        // Replace textarea with updated paragraph
        const updatedP = document.createElement('p');
        updatedP.className = 'text-gray-600 mt-2';
        updatedP.textContent = newText;
        textarea.replaceWith(updatedP);
        btnContainer.remove();
        if (deleteBtn) deleteBtn.style.display = '';
        buttonElement.style.display = '';
        showComments(referenceId);  // Reload comments
      })
      .catch(error => {
        alert(error.message);
      });
      }
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'bg-gray-300 text-black px-3 py-1 rounded';
    cancelBtn.onclick = function () {
      const originalP = document.createElement('p');
      originalP.className = 'text-gray-600 mt-2';
      originalP.textContent = originalText;
      textarea.replaceWith(originalP);
      btnContainer.remove();
      if (deleteBtn) deleteBtn.style.display = '';
      buttonElement.style.display = '';
    };

    btnContainer.appendChild(saveBtn);
    btnContainer.appendChild(cancelBtn);
    commentCard.appendChild(btnContainer);
}

function deleteComment(commentId, tree_identifier) {
    if (!confirm("Are you sure you want to delete this comment?")) return;
  
    fetch(`${identifyTreeURL}${commentId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${authToken}`,
        'Content-Type': 'application/json'
      },
    })
    .then(response => {
      if (response.ok) {
  
        showComments(tree_identifier);  // Reload comments if you have a loader function
        // location.reload();  // Or re-fetch and re-render the comment list
      } else {
        alert("Failed to delete the comment.");
      }
    })
    .catch(error => {
      console.error("Delete error:", error);
      alert("An error occurred while deleting the comment.");
    });
  }

window.addEventListener('DOMContentLoaded', async () => {
  const isOnline = await checkInternetConnection();
  if (isOnline) {
    uploadOfflineTrees();
  }
});

document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    const isOnline = await checkInternetConnection();
    const offlineTrees = localStorage.getItem("offlineTrees");
    if (isOnline && offlineTrees && JSON.parse(offlineTrees).length > 0 && authToken) {
      uploadOfflineTrees();
    }
  }
});
  // Listen for coming back online and trigger upload of saved data
window.addEventListener('online', () => {
  uploadOfflineTrees();
});


async function validateImageWithBackend(file) {
  showLoading()
  
  const isOnline = await checkInternetConnection();
  
    if (!isOnline) {
      hideLoading()
      console.warn("Offline mode detected — skipping backend validation.");
      return true; 
    }

  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await   fetch(validateImage, {
      method: 'POST',
      body: formData, 
    });

    const data = await res.json();
    hideLoading()

    return data.valid;
  } catch (err) {
    console.error("Validation failed", err);
    hideLoading()
    return false;
  }
}


function updateTreeImage(treeId, formData, carouselItem, refId, saveButton, fileInput) {
  fetch(`${treeArchiveURL}${treeId}/`, {
    method: "PATCH",
    headers: { 'Authorization': `Token ${authToken}` },
    body: formData
  })
    .then(response => {
      if (!response.ok) throw new Error(`Update failed: ${response.status}`);
      return response.json();
    })
    .then(data => {
      carouselItem.querySelector("img").src = data.image;

      const popupImg = document.querySelector(`#tree-photo-${refId}`);
      if (popupImg) {
        const firstItemImg = document.querySelector('#carouselItems .relative img');
        if (firstItemImg) popupImg.src = firstItemImg.src;
      }

      saveButton.style.display = "none";
      saveButton.disabled = true;
      fileInput.value = "";
      alert("Image updated successfully!");
    })
    .catch(error => alert(error.message));
}



function deleteTreeImage(treeId, carouselItem, refId, treeGallJSON, updateCarouselAfterDelete) {
  fetch(`${treeArchiveURL}${treeId}/`, {
    method: "DELETE",
    headers: {
      'Authorization': `Token ${authToken}`,
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (!response.ok) throw new Error(`Delete failed: ${response.status}`);

      // Remove DOM element
      const allItems = Array.from(document.querySelectorAll('#carouselItems .relative'));
      const allIndicators = Array.from(document.querySelectorAll('#carouselIndicators button'));
      const itemIndex = allItems.indexOf(carouselItem);

      carouselItem.remove();

      // Update popup image if it's the latest
      const popupImg = document.querySelector(`#tree-photo-${refId}`);
      if (popupImg) {
        const remainingItems = document.querySelectorAll('#carouselItems .relative img');
        popupImg.src = remainingItems.length > 0 ? remainingItems[0].src : '/static/img/no-image.png';
      }

      if (itemIndex !== -1 && allIndicators[itemIndex]) {
        allIndicators[itemIndex].remove();
      }

      // Remove from local data
      const idx = treeGallJSON.findIndex(t => t.id === treeId);
      if (idx !== -1) treeGallJSON.splice(idx, 1);

      // Refresh carousel UI
      updateCarouselAfterDelete();
    })
    .catch(error => alert(error.message));
}