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
function uploadOfflineTrees() {
  let offlineTrees = JSON.parse(localStorage.getItem('offlineTrees') || '[]');
  if (offlineTrees.length === 0) return;

  const uploadPromises = offlineTrees.map((tree, index) => {
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

    if (tree.image) {
      const blob = dataURLtoBlob(tree.image);
      formData.append('image', blob, 'offline-image.png');
    }

    return fetch(usertreeURL, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${authToken}`,
      },
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        // Return an object marking failure with reason
        return response.json()
          .then(errorData => {
            let errMsg = 'Unknown error';
            if (errorData.detail) {
              errMsg = errorData.detail;
            } else if (errorData.tree_name) {
              errMsg = errorData.tree_name.join(', ');
            } else if (typeof errorData === 'string') {
              errMsg = errorData;
            }
            return { success: false, index, error: errMsg };
          })
          .catch(() => ({ success: false, index, error: 'Failed to parse error response' }));
      }
      return response.json().then(() => ({ success: true, index }));
    })
    .catch(error => ({ success: false, index, error: error.message }));
  });

    Promise.all(uploadPromises)
    .then(results => {
      const failedUploads = results.filter(r => !r.success);
      const successfulUploads = results.filter(r => r.success);

      if (successfulUploads.length > 0) {
        alert(`${successfulUploads.length} offline tree(s) uploaded successfully.`);
      }
      if (failedUploads.length > 0) {
        let messages = failedUploads.map(f => `Tree #${f.index + 1}`).join('\n');
        alert(`Some offline trees failed to upload:\n${messages}`);
      }

      // Always clear offline data no matter success or failure
      localStorage.removeItem('offlineTrees');

      location.reload();
    })
    .catch(err => {
      console.error('Error uploading offline trees:', err);
      alert('An unexpected error occurred while uploading offline trees.');
    });
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
        const resizedReader = new FileReader();
        resizedReader.onload = () => resolve(resizedReader.result);
        resizedReader.onerror = reject;
        resizedReader.readAsDataURL(blob);
      }, 'image/jpeg', 0.7); // Lower quality for size reduction
    };

    reader.readAsDataURL(file);
  });
}



function uploadTree() {
  const plantName = document.getElementById('plant-name').value;
  const description = document.getElementById('description').value;
  const treeType = document.getElementById('tree-type').value;
  const image = document.getElementById('tree-photo').files[0];
  const latitude = Number(document.getElementById('latitude').value).toFixed(6);
  const longitude = Number(document.getElementById('longitude').value).toFixed(6);
  const username = localStorage.getItem('username') || sessionStorage.getItem('username');

  showLoading();

  if (!plantName || !description || !image || !treeType) {
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
  formData.append('status', "PLT");
  formData.append('image', image);
  formData.append('owning_user', username);

  checkInternetConnection().then(isOnline => {
    if (!isOnline) {
      // ✅ Compress + convert image before saving offline
      resizeImage(image).then(resizedBase64 => {
        const offlineData = {
          plantName,
          description,
          treeType,
          image: resizedBase64,
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
        document.getElementById('plant-name').value = '';
        document.getElementById('description').value = '';
        document.getElementById('tree-type').value = '';
        document.getElementById('tree-photo').value = '';
        document.getElementById('latitude').value = '';
        document.getElementById('longitude').value = '';
      }).catch(err => {
        console.error('Error resizing image:', err);
        hideLoading();
        alert("Failed to process image for offline saving.");
      });

    } else {
      // ✅ Online upload
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
  const image = document.getElementById('edit-tree-photo').files[0];
  const username = localStorage.getItem('username') || sessionStorage.getItem('username');
  const treeId = document.getElementById('edit-ref-id').value;

  showLoading();

  if (!plantName || !description || !treeId || !treeType) {
    hideLoading();
    alert("Please fill in all required fields before submitting.");
    return;
  }

  const formData = new FormData();
  formData.append('tree_name', plantName);
  formData.append('tree_description', description);
  formData.append('tree_type', treeType);
  formData.append('owning_user', username);
  if (image) {
    formData.append('image', image);
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
  formData.append("tree_identifier", referenceId);  // should match UserTreeInfo.reference_id
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
    // alert("Comment posted successfully!");
    document.querySelector('textarea[name="body"]').value = "";
    showComments(referenceId);  // Reload comments if you have a loader function
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

  window.addEventListener('DOMContentLoaded', () => {
    if (isOnline()) {
      uploadOfflineTrees();
    }
  });

  // Listen for coming back online and trigger upload of saved data
window.addEventListener('online', () => {
  uploadOfflineTrees();
});