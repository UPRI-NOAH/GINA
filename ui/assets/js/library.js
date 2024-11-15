// change URL for backend
let url = "punla.up.edu.ph";
let userURL = `https://${url}/api/tree-info/`;

// authentication token
var authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

var isLoggedIn = true;
// authentication checking
if (authToken){
  isLoggedIn = true;
} else {
  isLoggedIn = false;
}
// User buttons checking if user is logged in (logged in = icon, else = login/signup buttons)
if (isLoggedIn){
  document.getElementById('user-buttons').classList.remove('invis');
  document.getElementById('mobile-login').classList.add('invis');
  document.getElementById('user-buttons').classList.add('mobile-visible');
} else {
  document.getElementById('auth-buttons').classList.remove('invis');
  document.getElementById('mobile-login').classList.remove('invis');
  document.getElementById('user-buttons').classList.remove('mobile-visible');
}

// User Dropdown Toggle
document.getElementById('user-dropdown-toggle').addEventListener('click', function() {
    var dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('invis');
  });

// Toggle dropdown when clicking outside
document.addEventListener('click', function(event) {
  if (!event.target.closest('#user-dropdown') && !event.target.closest('#user-dropdown-toggle')) {
    document.getElementById("user-dropdown").classList.add("invis");
  }
});

// View Profile Function
function viewProfile() {
  // Add your profile viewing logic here
  // console.log("View Profile clicked");
  document.getElementById("user-dropdown").classList.add("hidden");
}

// Log Out Function
function logOut() {
  localStorage.setItem('authToken', '');
  sessionStorage.setItem('authToken', '');

  location.reload();
}


var treeLib = $.ajax({
  url: userURL,
  dataType: "json",
      headers: { 
      'ngrok-skip-browser-warning': 'true' 
  },
  // success: console.log("PH geojson data successfully loaded."),
  error: function (xhr) {
      alert(xhr.statusText)
  }
  })

  const treeGrid = document.getElementById("tree-grid");


  $.when(treeLib).done(function () {
    const bound = treeLib.responseJSON;
    const itemsPerPage = 12;
    let currentPage = 1;
    let filteredData = bound;
    // Function to render a specific page
    function renderPage(page) {
      treeGrid.innerHTML = '';
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const pageData = filteredData.slice(startIndex, endIndex);
      pageData.forEach((data) => {
        const row = document.createElement("div");
        row.className = "tree-container flex md:flex-col-reverse md:w-56 overflow-x-auto";
        row.innerHTML = `
          <div class="flex flex-col justify-center detail-container w-full h-32">
            <div class="text-xl font-bold" style="color:black"><p>${data.tree_name}</p></div>
            <div class="text-sm"><p><b>Scientific Name: </b><i>${data.scientific_name}</i></p></div>
            <div class="text-sm"><p><b>Family Name: </b><i>${data.family_name}</i></p></div>
          </div>
          <div class="flex-shrink">
            <img src="${data.tree_image}" class="w-full h-48 object-cover">
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
        button.className = "pagination-btn px-3 py-1 mx-1 border rounded bg-gray-200 hover:bg-gray-300";
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


  