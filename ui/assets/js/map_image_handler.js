let currentIndex = 0;

function clickTreeImg(name, refId) {
  showLoading();
  const overlay = document.getElementById("treeArchiveTitleOverlay");
  const map = document.getElementById("map");
  const treeTitle = document.getElementById('treeTitle');
  overlay?.classList.remove("invis");
  map?.classList.add("map-blurred");

  fetch(`${treeArchiveURL}?reference_id__reference_id=${refId}`, {
    headers: { 'ngrok-skip-browser-warning': 'true' }
  })
    .then(res => res.json())
    .then(data => {
      hideLoading();
      // indicators.innerHTML = '';
      const counter = document.createElement('div');
      counter.className = 'absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-50';
      counter.style.fontFamily = 'Arial, sans-serif';
      counter.dataset.role = 'counter';
      const itemsContainer = document.getElementById('carouselItems');
      itemsContainer.innerHTML = '';
      treeTitle.innerText = name;
      data.forEach((tree, idx) => {

        itemsContainer.appendChild(createCarouselItem(tree, data, refId));
      });

      initCarouselNav();
      updateCarousel();
      initCarouselDrag();
    });
}



// Carousel item
function createCarouselItem(tree, data, refId) {
  const currentUser = localStorage.getItem('username') || sessionStorage.getItem('username');
  const now = new Date();
  const plantDate = new Date(tree.planted_on);
  const canEdit = currentUser === tree.owning_user && now <= new Date(plantDate.getTime() + 3600000);

  const item = document.createElement('div');  // ← Make sure this is defined BEFORE any use
  item.className = 'relative float-left hidden w-60';
  item.innerHTML = `
    <img src="${tree.image}" class="block w-full h-80 object-cover mx-auto" />
    <div class="absolute inset-x-[15%] bottom-0 py-5 px-4 text-left text-white md:block rounded">
      <p class="bg-green-600 bg-opacity-50 px-1.5">Updated on: ${tree.planted_on}</p>
    </div>
  `;

  // Add 1/5 counter at the top-right
  const counter = document.createElement('div');
  counter.className = 'absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-50';
  counter.style.fontFamily = 'Arial, sans-serif';
  counter.dataset.role = 'counter';
  item.appendChild(counter);

  if (canEdit) {
    const { editBtn, deleteBtn, saveBtn, fileInput } = createControls(tree, refId, item, data);
    item.append(editBtn, deleteBtn, saveBtn, fileInput);
  }

  return item;
}

// Edit/Delete/Save buttons with og inline styles
function createControls(tree, refId, item, data) {
  // Count images with same date
  const dateCount = data.filter(t => t.planted_on === tree.planted_on).length;

  const isMobile = window.innerWidth <= 600; // or your mobile breakpoint

  // helper to shift left px value if mobile
  function shiftRight(leftPx) {
    const base = parseInt(leftPx.replace('px', ''), 10);
    const shiftAmount = isMobile ? 10 : 0; // shift by 10px on mobile
    return (base + shiftAmount) + 'px';
  }

  const editBtn = createBtn(
    'edit',
    'https://cdn-icons-png.flaticon.com/128/481/481874.png',
    `top:5px; left:${shiftRight('30px')}; background-color:#0095ff;`
  );
  const deleteBtn = createBtn(
    'delete',
    'https://cdn-icons-png.flaticon.com/128/6861/6861362.png',
    `top:5px; left:${shiftRight('60px')}; background-color:#ff4d4f;`
  );
  const saveBtn = createBtn(
    'save',
    '',
    `top:5px; left:${shiftRight('90px')}; background-color:#4CAF50;`,
    'Save'
  );

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.jpg,.jpeg,.png,.webp';
  fileInput.style.display = 'none';

  saveBtn.style.display = 'none';

  // Disable delete button if only one image for that date
  if (dateCount === 1) {
    deleteBtn.disabled = true;
    deleteBtn.style.opacity = '0.5';
  }

  editBtn.onclick = () => fileInput.click();

  fileInput.onchange = async () => {
    const file = fileInput.files[0];
    if (file && await validateImageWithBackend(file)) {
      const reader = new FileReader();
      reader.onload = e => {
        item.querySelector('img').src = e.target.result;
        saveBtn.style.display = 'inline-block';
      };
      reader.readAsDataURL(file);
    } else {
      alert('Invalid image');
      fileInput.value = '';
    }
  };

    saveBtn.onclick = () => {
      if (!fileInput.files[0]) return;

      // Disable and show loading state
      saveBtn.disabled = true;
      saveBtn.style.opacity = "0.5";
      saveBtn.textContent = "Saving...";

      const fd = new FormData();
      fd.append('image', fileInput.files[0]);

      updateTreeImage(tree.id, fd, item, refId, saveBtn, fileInput);
    };

  deleteBtn.onclick = () => {
    if (dateCount > 1 && confirm('Delete this image?')) {
      deleteTreeImage(tree.id, item, refId, data, updateCarousel);
    }
  };

  return { editBtn, deleteBtn, saveBtn, fileInput };
}


// Helper to create button with original style
function createBtn(role, iconUrl, extraStyle, text = '') {
  const btn = document.createElement('button');
  btn.dataset.role = role;
  btn.style.cssText = `
    position:absolute;z-index:1000;color:white;border:none;padding:5px;
    cursor:pointer;font-size:10px;border-radius:10px;${extraStyle}
  `;
  btn.innerHTML = iconUrl ? `<img src="${iconUrl}" style="width:15px;height:15px;">` : text;
  return btn;
}

// Update carousel state
function updateCarousel() {
  const items = document.querySelectorAll('#carouselItems .relative');
  const total = items.length;

  if (!items.length) {
    document.getElementById('carouselItems').innerHTML = `<div class="p-4 text-center text-gray-500">No images available.</div>`;
    return;
  }

  // Make sure currentIndex is within bounds
  if (currentIndex >= items.length) {
    currentIndex = items.length - 1;
  }
  if (currentIndex < 0) {
    currentIndex = 0;
  }

  items.forEach((item, i) => {
    // hide all by default
    item.classList.add('hidden');
    item.style.transform = 'translateX(0)';
    item.style.transition = 'none';

    // update counter
    const counter = item.querySelector('[data-role="counter"]');
    if (counter) {
      counter.textContent = `${i + 1}/${total}`;
    }
  });
  
  items[currentIndex].classList.remove('hidden');

  // Recalculate dateCounts dynamically
  const dateCounts = {};
  items.forEach(item => {
    const dateText = item.querySelector('p')?.innerText.replace('Updated on: ', '').trim();
    if (dateText) dateCounts[dateText] = (dateCounts[dateText] || 0) + 1;
  });
  
  items.forEach(item => {
    const dateText = item.querySelector('p')?.innerText.replace('Updated on: ', '').trim();
    const deleteBtn = item.querySelector('[data-role="delete"]');
    if (deleteBtn) {
      if (dateCounts[dateText] === 1) {
        deleteBtn.disabled = true;
        deleteBtn.style.opacity = '0.5';
      } else {
        deleteBtn.disabled = false;
        deleteBtn.style.opacity = '1';
      }
    }
  });
}

// Carousel navigation
function initCarouselNav() {
  const prev = document.querySelector('[data-twe-slide="prev"]');
  const next = document.querySelector('[data-twe-slide="next"]');
  prev.onclick = () => { currentIndex = (currentIndex - 1 + getItems().length) % getItems().length; updateCarousel(); };
  next.onclick = () => { currentIndex = (currentIndex + 1) % getItems().length; updateCarousel(); };
}
function getItems() {
  return document.querySelectorAll('#carouselItems .relative');
}

function initCarouselDrag() {
  const container = document.getElementById('carouselItems');
  container.style.overflow = 'hidden'; // Prevent image from going outside
  container.style.position = 'relative'; // Needed for layout

  let startX = 0;
  let currentX = 0;
  let isDragging = false;

  function getActiveItem() {
    return container.querySelectorAll('.relative')[currentIndex];
  }

  function startDrag(x) {
    startX = x;
    isDragging = true;
    const activeItem = getActiveItem();
    activeItem.style.transition = 'none';
  }

  function moveDrag(x) {
    if (!isDragging) return;
    currentX = x - startX;
    const activeItem = getActiveItem();
    activeItem.style.transform = `translateX(${currentX}px)`;
  }

  function endDrag() {
  if (!isDragging) return;
  isDragging = false;
  const activeItem = getActiveItem();
  activeItem.style.transition = 'transform 0.3s ease';

  if (Math.abs(currentX) > 50) {
    if (currentX < 0) {
      // Swipe left → next
      currentIndex = (currentIndex + 1) % getItems().length;
    } else {
      // Swipe right → prev
      currentIndex = (currentIndex - 1 + getItems().length) % getItems().length;
    }
  }

  // Reset position and currentX
  activeItem.style.transform = 'translateX(0)';
  currentX = 0;

  updateCarousel();
}
  // Touch events
  container.addEventListener('touchstart', (e) => startDrag(e.touches[0].clientX));
  container.addEventListener('touchmove', (e) => moveDrag(e.touches[0].clientX));
  container.addEventListener('touchend', endDrag);

  // Mouse events
  container.addEventListener('mousedown', (e) => startDrag(e.clientX));
  container.addEventListener('mousemove', (e) => moveDrag(e.clientX));
  container.addEventListener('mouseup', endDrag);
  container.addEventListener('mouseleave', endDrag);
}

//---------------------------------IMAGE INPUT HANDLER---------------------------------------------------------------//


const MAX_FILES = 5;

// Templates
const fileTempl = document.getElementById("file-template"),
      imageTempl = document.getElementById("image-template");

// Upload modal elements
const empty = document.getElementById("empty"),
      gallery = document.getElementById("gallery"),
      treePhotoHidden = document.getElementById("tree-photo");

// Edit modal elements
const editGallery = document.getElementById("edit-gallery"),
      editTreePhotoHidden = document.getElementById("edit-tree-photo");

// State
let FILES = [];      // Files for upload
let EDIT_FILES = []; // Files for edit
let isImageProcessing = false;

// Add file to gallery
function addFile(target, file, emptyEl) {
  const isEdit = target.id.includes("edit");
  const fileArray = isEdit ? EDIT_FILES : FILES;

  if (fileArray.length >= MAX_FILES) {
    alert(`You can only upload up to ${MAX_FILES} image(s).`);
    return;
  }

  const objectURL = URL.createObjectURL(file);
  const isImage = file.type.match("image.*");

  const clone = isImage
    ? imageTempl.content.cloneNode(true)
    : fileTempl.content.cloneNode(true);

  clone.querySelector("h1").textContent = file.name;
  clone.querySelector("li").id = objectURL;
  clone.querySelector(".delete").dataset.target = objectURL;
  clone.querySelector(".size").textContent =
    file.size > 1048576
      ? Math.round(file.size / 1048576) + "mb"
      : file.size > 1024
      ? Math.round(file.size / 1024) + "kb"
      : file.size + "b";

  if (isImage) {
    Object.assign(clone.querySelector("img"), {
      src: objectURL,
      alt: file.name
    });
  }

  emptyEl.classList.add("hidden");
  target.prepend(clone);
  fileArray.push({ file, id: objectURL });
}

// Handle file input selection (Upload Modal)
treePhotoHidden.onchange = async (e) => {
  await handleFileSelection(e.target.files, gallery, empty, FILES);
  e.target.value = "";
};

// Handle file input selection (Edit Modal)
editTreePhotoHidden.onchange = async (e) => {
  const emptyEl = document.getElementById("edit-empty");
  await handleFileSelection(e.target.files, editGallery, emptyEl, EDIT_FILES);
  e.target.value = "";
};

// Common handler for file validation + add
async function handleFileSelection(files, targetGallery, emptyEl, fileArray) {
  isImageProcessing = true;

  const selectedFiles = [...files];
  const total = fileArray.length + selectedFiles.length;

  if (total > MAX_FILES) {
    alert(`Only ${MAX_FILES} photo(s) allowed in total.`);
    isImageProcessing = false;
    return;
  }

  for (const file of selectedFiles) {
    const isValid = await validateImageWithBackend(file);
    if (isValid) {
      addFile(targetGallery, file, emptyEl);
    } else {
      alert(`Image "${file.name}" was rejected.`);
    }
  }

  isImageProcessing = false;
}

// Handle Drag and Drop
const hasFiles = ({ dataTransfer: { types = [] } }) => types.indexOf("Files") > -1;
let counter = 0;

async function dropHandler(ev, galleryId = "gallery") {
  ev.preventDefault();

  const droppedFiles = [...ev.dataTransfer.files];
  const isEdit = galleryId.includes("edit");
  const fileArray = isEdit ? EDIT_FILES : FILES;
  const targetGallery = document.getElementById(galleryId);
  const emptyEl = document.getElementById(galleryId.replace("gallery", "empty"));

  const remaining = MAX_FILES - fileArray.length;

  // Block the whole operation if user exceeds allowed count
  if (droppedFiles.length > remaining) {
    alert(`You can only add ${remaining} more image(s).`);
    hideDragOverlay(ev);
    return;
  }

  // Validate and add files one by one
  for (const file of droppedFiles) {
    const isValid = await validateImageWithBackend(file);
    if (isValid) {
      addFile(targetGallery, file, emptyEl);
    } else {
      alert(`Image "${file.name}" was rejected.`);
    }
  }

  hideDragOverlay(ev);
}



function dragEnterHandler(e) {
  e.preventDefault();
  if (!hasFiles(e)) return;

  const overlay = e.currentTarget.querySelector("div[id^='overlay-drag']");
  overlay.classList.remove("hidden");
}

function dragLeaveHandler(e) {
  const overlay = e.currentTarget.querySelector("div[id^='overlay-drag']");
  overlay.classList.add("hidden");
}

function dragOverHandler(e) {
  if (hasFiles(e)) e.preventDefault();
}

// Delete file from gallery
gallery.onclick = ({ target }) => {
  if (target.classList.contains("delete")) {
    const id = target.dataset.target;
    const li = document.getElementById(id);
    if (li) li.remove();
    FILES = FILES.filter(item => item.id !== id);
    if (FILES.length === 0) empty.classList.remove("hidden");
  }
};

editGallery.onclick = ({ target }) => {
  if (target.classList.contains("delete")) {
    const id = target.dataset.target;
    const li = document.getElementById(id);
    if (li) li.remove();
    EDIT_FILES = EDIT_FILES.filter(item => item.id !== id);
    if (EDIT_FILES.length === 0) {
      document.getElementById("edit-empty").classList.remove("hidden");
    }
  }
};


function resetUploadModal() {
  FILES = [];
  gallery.innerHTML = `
    <li id="empty" class="w-full text-center flex flex-col items-center justify-center">
      <img class="mx-auto w-16" src="https://user-images.githubusercontent.com/507615/54591670-ac0a0180-4a65-11e9-846c-e55ffce0fe7b.png" alt="no data" />
      <span class="text-xs text-gray-500">No files selected</span>
    </li>`;
}

function resetEditModal() {
  EDIT_FILES = [];
  editGallery.innerHTML = `
    <li id="edit-empty" class="w-full text-center flex flex-col items-center justify-center">
      <img class="mx-auto w-16" src="https://user-images.githubusercontent.com/507615/54591670-ac0a0180-4a65-11e9-846c-e55ffce0fe7b.png" alt="no data" />
      <span class="text-xs text-gray-500">No files selected</span>
    </li>`;
}

function closeUploadModal() {
  document.getElementById("uploadoverlay").classList.add("invis");
  resetUploadModal();
}

function closeEditModal() {
  document.getElementById("editoverlay").classList.add("invis");
  resetEditModal();
}

function hideDragOverlay(ev) {
  if (!ev || !ev.currentTarget || !ev.currentTarget.querySelector) return;
  const overlay = ev.currentTarget.querySelector("div[id^='overlay-drag']");
  if (overlay) overlay.classList.add("hidden");
  counter = 0;
}

// Trigger file input on button click
document.getElementById("upload-button").onclick = () => treePhotoHidden.click();
document.getElementById("edit-button").onclick = () => editTreePhotoHidden.click();

