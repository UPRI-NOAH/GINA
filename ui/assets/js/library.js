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

      // Previous button
      const prevButton = document.createElement("button");
      prevButton.innerHTML = `
        <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      `;
      prevButton.disabled = currentPage === 1;
      prevButton.className = `pagination-btn px-4 py-2 rounded-md border 
        ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-green-100 text-green-700 border-green-500'}`;
      prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          renderPage(currentPage);
          createPagination();
        }
      });
      paginationContainer.appendChild(prevButton);

      // Show only 3 page numbers centered around current page
      const maxVisible = 3;
      let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let endPage = Math.min(totalPages, startPage + maxVisible - 1);

      if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        const button = document.createElement("button");
        button.innerText = i;
        button.className = `pagination-btn px-4 py-2 rounded-md border mx-1 
          ${i === currentPage 
            ? 'bg-green-500 text-white border-green-500' 
            : 'bg-white hover:bg-green-100 text-green-700 border-green-500'}`;
        button.addEventListener("click", () => {
          currentPage = i;
          renderPage(currentPage);
          createPagination();
        });
        paginationContainer.appendChild(button);
      }

      // Add ellipsis and last page if needed (from leaderboard.js)
      if (endPage < totalPages) {
          if (endPage < totalPages - 1) {
              const ellipsis = document.createElement("span");
              ellipsis.innerText = "...";
              ellipsis.className = "px-1 sm:px-2 text-xs sm:text-sm text-gray-500 flex items-center";
              paginationContainer.appendChild(ellipsis);
          }
          
          const lastButton = document.createElement("button");
          lastButton.innerText = totalPages;
          lastButton.className = "pagination-btn rounded-md sm:rounded-lg border border-green-500 bg-white hover:bg-green-100 text-green-700 px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm min-w-[32px] sm:min-w-[40px] flex items-center justify-center transition-colors";
          lastButton.addEventListener("click", () => {
            currentPage = totalPages;
            renderPage(currentPage);
            createPagination();
          });
          paginationContainer.appendChild(lastButton);
      }

      // Next button
      const nextButton = document.createElement("button");
      nextButton.innerHTML = `
        <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      `;
      nextButton.disabled = currentPage === totalPages;
      nextButton.className = `pagination-btn px-4 py-2 rounded-md border 
        ${currentPage === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-green-100 text-green-700 border-green-500'}`;
      nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderPage(currentPage);
          createPagination();
        }
      });
      paginationContainer.appendChild(nextButton);
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
