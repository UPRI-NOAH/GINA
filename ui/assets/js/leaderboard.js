let currentPage = 1;
const itemsPerPage = 7;


// Static user data for testing
let bound = [
    { user: "Alice", user_points: 250 },
    { user: "Bob", user_points: 230 },
    { user: "Charlie", user_points: 220 },
    { user: "Diana", user_points: 210 },
    { user: "Eve", user_points: 200 },
    { user: "Frank", user_points: 190 },
    { user: "Grace", user_points: 180 },
    { user: "Heidi", user_points: 170 },
    { user: "Ivan", user_points: 160 },
    { user: "Judy", user_points: 150 },
    { user: "Karl", user_points: 140 },
    { user: "Laura", user_points: 130 },
    { user: "Mallory", user_points: 120 },
    { user: "Niaj", user_points: 110 },
    { user: "Olivia", user_points: 100 },
    { user: "Peggy", user_points: 90 },
    { user: "Quentin", user_points: 80 },
    { user: "Rupert", user_points: 70 },
    { user: "Sybil", user_points: 60 },
    { user: "Trent", user_points: 50 },
        { user: "Frank", user_points: 190 },
    { user: "Grace", user_points: 180 },
    { user: "Heidi", user_points: 170 },
    { user: "Ivan", user_points: 160 },
    { user: "Judy", user_points: 150 },
    { user: "Karl", user_points: 140 },
    { user: "Laura", user_points: 130 },
    { user: "Mallory", user_points: 120 },
    { user: "Niaj", user_points: 110 },
    { user: "Olivia", user_points: 100 },
    { user: "Peggy", user_points: 90 },
    { user: "Quentin", user_points: 80 },
    { user: "Rupert", user_points: 70 },
    { user: "Sybil", user_points: 60 },
    { user: "Trent", user_points: 50 },
        { user: "Frank", user_points: 190 },
    { user: "Grace", user_points: 180 },
    { user: "Heidi", user_points: 170 },
    { user: "Ivan", user_points: 160 },
    { user: "Judy", user_points: 150 },
    { user: "Karl", user_points: 140 },
    { user: "Laura", user_points: 130 },
    { user: "Mallory", user_points: 120 },
    { user: "Niaj", user_points: 110 },
    { user: "Olivia", user_points: 100 },
    { user: "Peggy", user_points: 90 },
    { user: "Quentin", user_points: 80 },
    { user: "Rupert", user_points: 70 },
    { user: "Sybil", user_points: 60 },
    { user: "Trent", user_points: 50 },
        { user: "Frank", user_points: 190 },
    { user: "Grace", user_points: 180 },
    { user: "Heidi", user_points: 170 },
    { user: "Ivan", user_points: 160 },
    { user: "Judy", user_points: 150 },
    { user: "Karl", user_points: 140 },
    { user: "Laura", user_points: 130 },
    { user: "Mallory", user_points: 120 },
    { user: "Niaj", user_points: 110 },
    { user: "Olivia", user_points: 100 },
    { user: "Peggy", user_points: 90 },
    { user: "Quentin", user_points: 80 },
    { user: "Rupert", user_points: 70 },
    { user: "Sybil", user_points: 60 },
    { user: "Trent", user_points: 50 },
      { user: "Grace", user_points: 180 },
    { user: "Heidi", user_points: 170 },
    { user: "Ivan", user_points: 160 },
    { user: "Judy", user_points: 150 },
    { user: "Karl", user_points: 140 },
    { user: "Laura", user_points: 130 },
    { user: "Mallory", user_points: 120 },
    { user: "Niaj", user_points: 110 },
    { user: "Olivia", user_points: 100 },
    { user: "Peggy", user_points: 90 },
    { user: "Quentin", user_points: 80 },
    { user: "Rupert", user_points: 70 },
    { user: "Sybil", user_points: 60 },
    { user: "Trent", user_points: 50 },
      { user: "Grace", user_points: 180 },
    { user: "Heidi", user_points: 170 },
    { user: "Ivan", user_points: 160 },
    { user: "Judy", user_points: 150 },
    { user: "Karl", user_points: 140 },
    { user: "Laura", user_points: 130 },
    { user: "Mallory", user_points: 120 },
    { user: "Niaj", user_points: 110 },
    { user: "Olivia", user_points: 100 },
    { user: "Peggy", user_points: 90 },
    { user: "Quentin", user_points: 80 },
    { user: "Rupert", user_points: 70 },
    { user: "Sybil", user_points: 60 },
    { user: "Trent", user_points: 50 },
    
];

// Sort and render immediately for static data
bound.sort((a, b) => b.user_points - a.user_points);
renderPodium();
renderLeaderboard();

// Comment out or remove the AJAX code below when using static data
/*
var ph = $.ajax({
    url: userURL,
    dataType: "json",
    headers: { 
        'ngrok-skip-browser-warning': 'true' 
    },
    error: function (xhr) {
        alert(xhr.statusText)
    }
});
showLoading();
$.when(ph).done(function () {
    hideLoading();
    bound = ph.responseJSON;
    bound.sort((a, b) => b.user_points - a.user_points); // Sort in descending order
    renderPodium();
    renderLeaderboard();  
});
*/
// ...existing code...

function renderPodium() {
    const podiumSection = document.getElementById('podium-section');

    if (bound.length < 3) {
        podiumSection.innerHTML = '<p class="text-gray-500 text-center">Loading podium...</p>';
        return;
    }

    const top3 = bound.slice(0, 3);
    const medalData = [
        { icon: 'assets/img/gold-medal.png', alt: 'Gold Medal', fallback: '🥇', size: 'w-20 h-20' },
        { icon: 'assets/img/silver-medal.png', alt: 'Silver Medal', fallback: '🥈', size: 'w-16 h-16' },
        { icon: 'assets/img/bronze-medal.png', alt: 'Bronze Medal', fallback: '🥉', size: 'w-16 h-16' }
    ];

    const podiumOrder = [1, 0, 2];

    podiumSection.innerHTML = '<div class="flex justify-center items-end gap-4 w-full max-w-4xl mx-auto">';

    podiumOrder.forEach(orderIndex => {
        const player = top3[orderIndex];
        const medal = medalData[orderIndex];

        let extraMargin = '';
        if (orderIndex === 0) extraMargin = 'mt-0';
        if (orderIndex === 1 || orderIndex === 2) extraMargin = 'mt-4';

        const podiumCard = document.createElement('div');
        podiumCard.className = `${extraMargin} w-40 bg-nav rounded-lg shadow-lg text-center p-4 transform hover:scale-105 transition-transform`;

        podiumCard.innerHTML = `
            <div class="${medal.size} mx-auto mb-3">
                <img src="${medal.icon}" alt="${medal.alt}" class="w-full h-full object-contain">
            </div>
            <h3 class="font-semibold text-gray-800">${player.user}</h3>
            <p class="text-gray-600 text-sm">${player.user_points}</p>
        `;

        podiumSection.querySelector('div').appendChild(podiumCard);
    });
}

function renderLeaderboard() {
    const leaderboardBody = document.getElementById('leaderboard-body');
    
    if (bound.length === 0) {
        leaderboardBody.innerHTML = '<div class="px-6 py-4 text-center text-gray-500">Loading leaderboard...</div>';
        return;
    }

    const leaderboardData = bound.slice(3);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = leaderboardData.slice(startIndex, endIndex);
    
    leaderboardBody.innerHTML = '';

    pageData.forEach((data, index) => {
        const actualRank = startIndex + index + 4;
        const isHighlighted = data.highlighted || false; 
        const usernameClass = isHighlighted ? 'font-semibold' : '';
        
        const row = document.createElement('div');
        row.className = `px-5 py-2 w-full flex `;
        row.innerHTML = `
            <div class="flex items-center justify-between w-full p-3 max-w-2xl mx-auto bg-white rounded-lg shadow-md">
                <span class="font-medium text-gray-800 w-20 text-left">${actualRank}</span>
                <span class=" text-gray-700 text-center ${usernameClass}">${data.user}</span>
                <span class="font-semibold text-gray-800 w-20 text-right">${data.user_points}</span>
            </div>
        `;
        leaderboardBody.appendChild(row);
    });

    updatePagination(leaderboardData.length);
}

function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationContainer = document.getElementById('pagination-controls');
    
    // Always show pagination, even for single page
    paginationContainer.innerHTML = '';
    
    // Add responsive centering classes
    paginationContainer.className = 'flex justify-center items-center gap-1 sm:gap-2 flex-wrap px-2 py-2';
    
    // Previous button (always disabled for page 1)
    const prevButton = document.createElement("button");
    prevButton.innerHTML = `
        <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
    `;
    prevButton.className = currentPage === 1 
        ? "pagination-btn rounded-md sm:rounded-lg border border-gray-300 bg-gray-300 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-500 cursor-not-allowed min-w-[32px] sm:min-w-[40px] flex items-center justify-center"
        : "pagination-btn rounded-md sm:rounded-lg border border-green-500 bg-green-500 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm text-white hover:bg-green-300 hover:border-green-300 min-w-[32px] sm:min-w-[40px] flex items-center justify-center transition-colors";
    
    if (currentPage > 1) {
        prevButton.addEventListener("click", () => {
            changePage(currentPage - 1);
        });
    }
    paginationContainer.appendChild(prevButton);

    if (totalPages <= 1) {
        // Show just page 1 button for single page
        const singlePageButton = document.createElement("button");
        singlePageButton.innerText = 1;
        singlePageButton.className = "pagination-btn rounded-md sm:rounded-lg border border-green-700 bg-green-700 px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-white min-w-[32px] sm:min-w-[40px] flex items-center justify-center";
        paginationContainer.appendChild(singlePageButton);
    } else {
        // Calculate page range to show for multiple pages
        const maxVisiblePages = window.innerWidth < 640 ? 5 : 8; // Fewer pages on mobile
        let startPage = 1;
        let endPage = Math.min(totalPages, maxVisiblePages);
        
        if (totalPages > maxVisiblePages) {
            const halfVisible = Math.floor(maxVisiblePages / 2);
            
            if (currentPage > halfVisible) {
                startPage = Math.max(1, currentPage - halfVisible);
                endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                
                // Adjust if we're near the end
                if (endPage === totalPages && endPage - startPage < maxVisiblePages - 1) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }
            }
        }

        // Add first page and ellipsis if needed
        if (startPage > 1) {
            const firstButton = document.createElement("button");
            firstButton.innerText = 1;
            firstButton.className = "pagination-btn rounded-md sm:rounded-lg border border-green-500 bg-green-500 px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-white hover:bg-green-300 hover:border-green-300 min-w-[32px] sm:min-w-[40px] flex items-center justify-center transition-colors";
            firstButton.addEventListener("click", () => {
                changePage(1);
            });
            paginationContainer.appendChild(firstButton);
            
            if (startPage > 2) {
                const ellipsis = document.createElement("span");
                ellipsis.innerText = "...";
                ellipsis.className = "px-1 sm:px-2 text-xs sm:text-sm text-gray-500 flex items-center";
                paginationContainer.appendChild(ellipsis);
            }
        }

        // Page number buttons
        for (let i = startPage; i <= endPage; i++) {
            const button = document.createElement("button");
            button.innerText = i;
            button.className = i === currentPage 
                ? "pagination-btn rounded-md sm:rounded-lg border border-green-700 bg-green-700 px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-white min-w-[32px] sm:min-w-[40px] flex items-center justify-center font-medium"
                : "pagination-btn rounded-md sm:rounded-lg border border-green-500 bg-green-500 px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-white hover:bg-green-300 hover:border-green-300 min-w-[32px] sm:min-w-[40px] flex items-center justify-center transition-colors";
            
            button.addEventListener("click", () => {
                changePage(i);
            });
            paginationContainer.appendChild(button);
        }

        // Add ellipsis and last page if needed
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement("span");
                ellipsis.innerText = "...";
                ellipsis.className = "px-1 sm:px-2 text-xs sm:text-sm text-gray-500 flex items-center";
                paginationContainer.appendChild(ellipsis);
            }
            
            const lastButton = document.createElement("button");
            lastButton.innerText = totalPages;
            lastButton.className = "pagination-btn rounded-md sm:rounded-lg border border-green-500 bg-green-500 px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-white hover:bg-green-300 hover:border-green-300 min-w-[32px] sm:min-w-[40px] flex items-center justify-center transition-colors";
            lastButton.addEventListener("click", () => {
                changePage(totalPages);
            });
            paginationContainer.appendChild(lastButton);
        }
    }

    // Next button (always disabled for last page or single page)
    const nextButton = document.createElement("button");
    nextButton.innerHTML = `
        <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
    `;
    nextButton.className = currentPage >= totalPages 
        ? "pagination-btn rounded-md sm:rounded-lg border border-gray-300 bg-gray-300 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-500 cursor-not-allowed min-w-[32px] sm:min-w-[40px] flex items-center justify-center"
        : "pagination-btn rounded-md sm:rounded-lg border border-green-500 bg-green-500 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm text-white hover:bg-green-300 hover:border-green-300 min-w-[32px] sm:min-w-[40px] flex items-center justify-center transition-colors";
    
    if (currentPage < totalPages) {
        nextButton.addEventListener("click", () => {
            changePage(currentPage + 1);
        });
    }
    paginationContainer.appendChild(nextButton);
}

function changePage(newPage) {
    if (bound.length === 0) return;
    
    const leaderboardData = bound.slice(3);
    const totalPages = Math.ceil(leaderboardData.length / itemsPerPage);
    
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
        currentPage = newPage;
        renderLeaderboard();
    }
}