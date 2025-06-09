// updating leaderboard content
const leaderboardBody = document.getElementById("leaderboard-body");

var ph = $.ajax({
    url: userURL,
    dataType: "json",
        headers: { 
        'ngrok-skip-browser-warning': 'true' 
    },
    error: function (xhr) {
        alert(xhr.statusText)
    }
    })
    showLoading()
    $.when(ph).done(function () {
      hideLoading()
      bound = ph.responseJSON
      bound.sort((a, b) => b.user_points - a.user_points); // Sort in descending order
      bound.forEach((data, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
        <td class="px-4 py-2">${index+1}</td>
        <td class="px-4 py-2">${data.user}</td>
        <td class="px-4 py-2">${data.user_points}</td>
        `;
        leaderboardBody.appendChild(row);
      });
    });