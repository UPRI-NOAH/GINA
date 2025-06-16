let currentPage = 1;
const itemsPerPage = 7;
let bound = [];

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

function renderPodium() {
    const podiumSection = document.getElementById('podium-section');
    
    if (bound.length < 3) {
        podiumSection.innerHTML = '<p class="text-gray-500 text-center">Loading podium...</p>';
        return;
    }

    // Get top 3 
    const top3 = bound.slice(0, 3);
    
    // Get the medal icons and colors for each position
    const medalData = [
        { 
            icon: 'assets/img/gold-medal.png', 
            alt: 'Gold Medal',
            fallback: '🥇' 
        },
        { 
            icon: 'assets/img/silver-medal.png', 
            alt: 'Silver Medal',
            fallback: '🥈' 
        },
        { 
            icon: 'assets/img/bronze-medal.png', 
            alt: 'Bronze Medal',
            fallback: '🥉' 
        }
    ];
    
    // Order for podium display: 2nd, 1st, 3rd
    const podiumOrder = [1, 0, 2]; // indices for 2nd, 1st, 3rd place
    
    podiumSection.innerHTML = '';
    
    podiumOrder.forEach(orderIndex => {
        const player = top3[orderIndex];
        const medal = medalData[orderIndex];
    
        const podiumCard = document.createElement('div');
        podiumCard.className = `w-full p-4 bg-nav rounded-lg shadow-lg text-center transform hover:scale-105 transition-transform`;
        
        podiumCard.innerHTML = `
            <div class="w-16 h-16 mx-auto mb-3">
                <img src="${medal.icon}" alt="${orderIndex === 0 ? 'Gold' : orderIndex === 1 ? 'Silver' : 'Bronze'} Medal" class="w-full h-full object-contain">
            </div>
            <h3 class="font-semibold text-gray-800">${player.user}</h3>
            <p class="text-gray-600 text-sm">${player.user_points}</p>
        `;
        
        podiumSection.appendChild(podiumCard);
    });
}

function renderLeaderboard() {
    const leaderboardBody = document.getElementById('leaderboard-body');
    
    if (bound.length === 0) {
        leaderboardBody.innerHTML = '<div class="px-6 py-4 text-center text-gray-500">Loading leaderboard...</div>';
        return;
    }

    // Get data for current page (starting from rank 4)
    const leaderboardData = bound.slice(3); // Skip top 3 for podium
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = leaderboardData.slice(startIndex, endIndex);
    
    leaderboardBody.innerHTML = '';

    pageData.forEach((data, index) => {
        const actualRank = startIndex + index + 4; // +4 because we start from rank 4
        const isHighlighted = data.highlighted || false; 
        const usernameClass = isHighlighted ? 'font-semibold' : '';
        
        const row = document.createElement('div');
        row.className = `px-6 py-4 transition-colors w-full flex justify-center`;
        row.innerHTML = `
            <div class="bg-white flex items-center text-center p-5 rounded-lg shadow-sm w-full max-w-2xl">
                <span class="font-medium text-gray-800 w-16 text-center">${actualRank}</span>
                <span class="text-gray-700 flex-1 text-center ${usernameClass}">${data.user}</span>
                <span class="font-semibold text-gray-800 w-20 text-center">${data.user_points}</span>
            </div>
        `;
        leaderboardBody.appendChild(row);
    });

    updatePagination(leaderboardData.length);
}

function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    document.getElementById('page-number').textContent = currentPage;
    
    // Update button states
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage >= totalPages;
    
    prevBtn.className = currentPage === 1 
        ? 'p-1 rounded transition-colors opacity-50 cursor-not-allowed'
        : 'p-1 hover:bg-gray-100 rounded transition-colors';
        
    nextBtn.className = currentPage >= totalPages
        ? 'p-1 rounded transition-colors opacity-50 cursor-not-allowed'
        : 'p-1 hover:bg-gray-100 rounded transition-colors';
}

function changePage(direction) {
    if (bound.length === 0) return;
    
    const leaderboardData = bound.slice(3);
    const totalPages = Math.ceil(leaderboardData.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderLeaderboard();
    }
}