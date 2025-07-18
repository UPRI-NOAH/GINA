let currentIndex = 0;

function clickTreeImg(name, refId) {
  showLoading();
  const overlay = document.getElementById("treeArchiveTitleOverlay");
  const map = document.getElementById("map");
  const treeTitle = document.getElementById('treeTitle');
  overlay?.classList.remove("invis");
  map?.classList.add("map-blurred");
  treeTitle.innerText = name;

  fetch(`${treeArchiveURL}?reference_id__reference_id=${refId}`, {
    headers: { 'ngrok-skip-browser-warning': 'true' }
  })
    .then(res => res.json())
    .then(data => {
      hideLoading();
      const indicators = document.getElementById('carouselIndicators') || createIndicatorsContainer();
      indicators.style.bottom = '-10px'
      indicators.innerHTML = '';
      const itemsContainer = document.getElementById('carouselItems');
      itemsContainer.innerHTML = '';

      data.forEach((tree, idx) => {
        indicators.appendChild(createIndicator(idx));
        itemsContainer.appendChild(createCarouselItem(tree, data, refId));
      });

      initCarouselNav();
      updateCarousel();
      initCarouselDrag();
    });
}

// Indicator container
function createIndicatorsContainer() {
  const el = document.createElement('div');
  el.id = 'carouselIndicators';
  el.className = `
    absolute bottom-0 left-0 right-0 z-[2]
    mx-[15%] mb-4 flex list-none justify-center p-0
  `;
  el.setAttribute('data-twe-carousel-indicators', '');
  document.getElementById('carouselExampleCaptions').appendChild(el);
  return el;
}

// Indicator
function createIndicator(i) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('data-twe-slide-to', i);
  btn.className = `
  mx-1 h-2 w-2 rounded-full bg-green-600 opacity-50
  border border-white z-50
`;
  if (i === 0) btn.classList.replace('opacity-50', 'opacity-100');
  btn.onclick = () => { currentIndex = i; updateCarousel(); };
  return btn;
}

// Carousel item
function createCarouselItem(tree, data, refId) {
  const currentUser = localStorage.getItem('username') || sessionStorage.getItem('username');
  const now = new Date();
  const plantDate = new Date(tree.planted_on);
  const canEdit = currentUser === tree.owning_user && now <= new Date(plantDate.getTime() + 3600000);
  const item = document.createElement('div');
  item.className = 'relative float-left hidden w-60';
  item.innerHTML = `
    <img src="${tree.image}" class="block w-full h-80 object-cover mx-auto" />
    <div class="absolute inset-x-[15%] bottom-0 py-5 px-4 text-left text-white md:block rounded">
      <p class="bg-green-600 bg-opacity-50 px-1.5">Updated on: ${tree.planted_on}</p>
    </div>
  `;

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
    `top:5px; left:${shiftRight('20px')}; background-color:#0095ff;`
  );
  const deleteBtn = createBtn(
    'delete',
    'https://cdn-icons-png.flaticon.com/128/6861/6861362.png',
    `top:5px; left:${shiftRight('50px')}; background-color:#ff4d4f;`
  );
  const saveBtn = createBtn(
    'save',
    '',
    `top:5px; left:${shiftRight('80px')}; background-color:#4CAF50;`,
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
  const indicators = document.querySelectorAll('#carouselIndicators button');

  if (!items.length) {
    document.getElementById('carouselItems').innerHTML = `<div class="p-4 text-center text-gray-500">No images available.</div>`;
    document.getElementById('carouselIndicators').innerHTML = '';
    return;
  }

  // Make sure currentIndex is within bounds
  if (currentIndex >= items.length) {
    currentIndex = items.length - 1;
  }
  if (currentIndex < 0) {
    currentIndex = 0;
  }

  items.forEach(i => i.classList.add('hidden'));
  indicators.forEach(i => i.classList.replace('opacity-100', 'opacity-50'));

  items[currentIndex].classList.remove('hidden');
  indicators[currentIndex].classList.replace('opacity-50', 'opacity-100');

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

const MAX_FILES = 3;

const fileTempl = document.getElementById("file-template"),
  imageTempl = document.getElementById("image-template"),
  empty = document.getElementById("empty"),
  gallery = document.getElementById("gallery"),
  editGallery = document.getElementById("edit-gallery"),
  overlay = document.getElementById("overlay"),
  treePhotoHidden = document.getElementById("tree-photo"),
  editTreePhotoHidden = document.getElementById("edit-tree-photo")

let FILES = []; // store selected files
let EDIT_FILES = []; // store selected files

let isImageProcessing = false;

// Add file to gallery
function addFile(target, file, emptyEl = empty) {
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

  if (emptyEl) emptyEl.classList.add("hidden");
  target.prepend(clone);
  fileArray.push({ file, id: objectURL });
}


// Trigger file input on button click
document.getElementById("upload-button").onclick = () => treePhotoHidden.click();
document.getElementById("edit-button").onclick = () => editTreePhotoHidden.click();

// Handle file input change
treePhotoHidden.onchange = async (e) => {
  isImageProcessing = true;
  const selectedFiles = [...e.target.files];
  const total = FILES.length + selectedFiles.length;

  if (total > MAX_FILES) {
    alert(`Only ${MAX_FILES} photo(s) allowed in total.`);
    e.target.value = "";
    isImageProcessing = false;
    return; 
  }

  for (const file of selectedFiles) {
    const isValid = await validateImageWithBackend(file);
    if (isValid) {
      addFile(gallery, file);
    } else {
      alert(`Image "${file.name}" was rejected.`);
    }
  }

  e.target.value = "";
  isImageProcessing = false;
};

editTreePhotoHidden.onchange = async (e) => {
  isImageProcessing = true;

  const files = [...e.target.files];
  const gallery = document.getElementById("edit-gallery");
  const empty = document.getElementById("edit-empty");
  const currentCount = gallery.querySelectorAll("li:not(#edit-empty)").length;
  const total = currentCount + files.length;

  if (total > MAX_FILES) {
    alert(`Only ${MAX_FILES} photo(s) allowed in total.`);
    e.target.value = "";
    isImageProcessing = false;
    return;
  }

  for (const file of files) {
    const isValid = await validateImageWithBackend(file);
    if (isValid) {
      addFile(gallery, file, empty);
    } else {
      alert(`Image "${file.name}" was rejected.`);
    }
  }

  e.target.value = "";
  isImageProcessing = false;
};

//Handle drag events
const hasFiles = ({ dataTransfer: { types = [] } }) =>
  types.indexOf("Files") > -1;

let counter = 0;

function dropHandler(ev, inputId = "tree-photo", galleryId = "gallery") {
  ev.preventDefault();

  const droppedFiles = [...ev.dataTransfer.files];
  const isEdit = galleryId.includes("edit");
  const fileArray = isEdit ? EDIT_FILES : FILES;
  const gallery = document.getElementById(galleryId);
  const emptyEl = document.getElementById(galleryId.replace("gallery", "empty"));
  const overlayEl = ev.currentTarget.querySelector("#overlay-drag");

  const remaining = MAX_FILES - fileArray.length;

  if (droppedFiles.length > remaining) {
    alert(`You can only add ${remaining} more image(s).`);
  }

  droppedFiles.slice(0, remaining).forEach(file => addFile(gallery, file, emptyEl));

  if (overlayEl) overlayEl.classList.remove("draggedover");
  counter = 0;
}

function dragEnterHandler(e) {
  e.preventDefault();
  if (!hasFiles(e)) return;

  ++counter;
  overlay.classList.add("draggedover");
}

function dragLeaveHandler(e) {
  if (--counter < 1) {
    overlay.classList.remove("draggedover");
  }
}

function dragOverHandler(e) {
  if (hasFiles(e)) {
    e.preventDefault();
  }
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
