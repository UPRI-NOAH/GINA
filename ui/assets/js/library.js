var treeLib = $.ajax({
  url: treeUrl,
  dataType: "json",
      headers: { 
      'ngrok-skip-browser-warning': 'true' 
  },
  error: function (xhr) {
      alert(xhr.statusText)
  }
  })
  showLoading()
  const treeGrid = document.getElementById("tree-grid");

  $.when(treeLib).done(function () {
    hideLoading()
    const bound = treeLib.responseJSON;
    const itemsPerPage = 12;
    let currentPage = 1;
    let filteredData = bound;
    // Function to render a specific page
    function renderPage(page) {
      // hideLoading()
      treeGrid.innerHTML = '';
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const pageData = filteredData.slice(startIndex, endIndex);
      pageData.forEach((data) => {
        const row = document.createElement("div");
        row.className = "tree-container flex flex-col md:flex-row md:w-64 p-2 shadow-lg overflow-x-auto mx-auto transform hover:scale-105 transition duration-500";
        row.innerHTML = `
          <div onclick="openModal('${data.tree_name}', '${data.scientific_name}', '${data.family_name}', '${data.tree_image}', \`${data.description || 'No description available.'}\`)" class="cursor-pointer">
            <div class="flex-shrink">
              <img src="${data.tree_image}" class="w-full h-48 object-cover rounded-xl">
            </div>
            <div class="flex flex-col justify-center detail-container w-full h-32">
              <div class="text-xl font-bold" style="color:#047857"><p>${data.tree_name}</p></div>
              <div class="text-sm" style="color:#303030"><p><b>Scientific Name: </b><i>${data.scientific_name}</i></p></div>
              <div class="text-sm" style="color:#303030"><p><b>Family Name: </b><i>${data.family_name}</i></p></div>
            </div>
          </div>
          
        `;
        treeGrid.appendChild(row);
      });
    }
    // Function to create pagination buttons
    function createPagination() {
      const paginationContainer = document.getElementById("pagination");
      paginationContainer.innerHTML = '';
      const totalPages = Math.ceil(filteredData.length / itemsPerPage);
      for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement("button");
        button.innerText = i;
        button.className = "pagination-btn rounded-lg border border-green-500 bg-green-500 px-4 py-2 text-white hover:bg-green-300 hover:border-green-300";
        button.addEventListener("click", () => {
          currentPage = i;
          renderPage(currentPage);
        });
        paginationContainer.appendChild(button);
      }
    }
    // Function to filter data based on search query
    function searchTrees() {
      const query = searchInput.value.toLowerCase();
      filteredData = bound.filter(data => data.tree_name.toLowerCase().includes(query));
      currentPage = 1; // Reset to the first page for new search results
      renderPage(currentPage);
      createPagination();
    }
    // Set up initial render, pagination, and search event listener
    renderPage(currentPage);
    createPagination();
    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", searchTrees);
  });


function openModal(name, scientific, family, image, description) {
  document.getElementById("modalImage").src = image;
  document.getElementById("modalName").textContent = name;
  document.getElementById("modalScientific").textContent = scientific;
  document.getElementById("modalFamily").textContent = family;
  document.getElementById("modalDescription").textContent = description || "No description available.";
  document.getElementById("treeModal").classList.remove("hidden");
  document.getElementById("treeModal").classList.add("flex");
  document.body.style.overflow = 'hidden'
}

function closeModal() {
  document.getElementById("treeModal").classList.remove("flex");
  document.getElementById("treeModal").classList.add("hidden");
  document.body.style.overflow = ''
}

// Close modal when clicking outside the content box
document.addEventListener("click", function (event) {
  const modal = document.getElementById("treeModal");
  // const modalContent = modal.querySelector("div.bg-white");

  if (!modal.classList.contains("hidden") && event.target === modal) {
    closeModal();
  }
});
