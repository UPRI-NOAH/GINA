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

  Promise.all(offlineTrees.map(tree => {
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
    });
  }))
  .then(() => {
        alert("Tree uploaded succesfully");
  
        localStorage.removeItem('offlineTrees');
        alert('All offline tree data has been uploaded successfully!');
        location.reload(); // reload the page after the PATCH request is complete

  })
  .catch(err => {
    console.error('Error uploading offline trees:', err);
  });
}



function isOnline() {
  return navigator.onLine;
}


function uploadTree() {
  const plantName = document.getElementById('plant-name').value;
  const description = document.getElementById('description').value;
  const treeType = document.getElementById('tree-type').value;
  const image = document.getElementById('tree-photo').files[0]; // Image file
  const latitude = Number(document.getElementById('latitude').value).toFixed(6);
  const longitude = Number(document.getElementById('longitude').value).toFixed(6);
  var username = localStorage.getItem('username') || sessionStorage.getItem('username');

  showLoading();

  if (!plantName || !description || !image || !treeType) {
    hideLoading();
    alert("Please fill in all fields and upload a photo before submitting.");
    return;
  }

  var formData = new FormData();
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
      const reader = new FileReader();
      reader.onload = function(event) {
        const offlineData = {
          plantName,
          description,
          treeType,
          image: event.target.result,
          latitude,
          longitude,
          username,
          timestamp: Date.now(),
          action: picAction
        };
        saveTreeDataOffline(offlineData);
        hideLoading();
        alert("You're offline. Your data has been saved and will upload automatically once you're back online.");
        document.getElementById("uploadoverlay").classList.add("invis");
        document.getElementById("map").classList.remove("map-blurred");
        document.getElementById('plant-name').value = '';
        document.getElementById('description').value = '';
        document.getElementById('tree-type').value = '';
        document.getElementById('tree-photo').value = '';
        document.getElementById('latitude').value = '';
        document.getElementById('longitude').value = '';
      };
      reader.readAsDataURL(image);
    } else {
      fetch(usertreeURL, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${authToken}`,
        },
        contentType: false,
        processData: false,
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to upload tree data.');
        }
        return response.json();
      })
      .then(data => {
        alert("Tree uploaded successfully");
        document.getElementById("map").classList.remove("map-blurred");
        document.getElementById("uploadoverlay").classList.add("invis");
        hideLoading();
        location.reload(); // Reload to reflect new data/points
      })
      .catch(error => {
        console.error('Error:', error);
        hideLoading();
        alert("An error occurred while uploading the tree. Please try again.");
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
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to edit tree data.');
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
    console.error('Error:', error);
    hideLoading();
    alert("An error occurred while editing the tree. Please try again.");
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