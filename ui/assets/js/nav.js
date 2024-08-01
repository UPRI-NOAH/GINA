function toggleNav(){
    document.getElementById('mobile-menu').classList.toggle('hidden');
}

function toggleSearchBarContainer(){
    var searchBarContainer = document.getElementById('searchbar-container');
    var menuButton = document.getElementById('menu-button');
    var logoContainer = document.getElementById('logo-container');

    var isHidden = searchBarContainer.classList.contains('hidden');
    if (isHidden) {
        menuButton.classList.add('hidden');
        logoContainer.classList.add('hidden');
        searchBarContainer.classList.remove('hidden');
    }
}

function hideSearchBarContainer(){
    document.getElementById('menu-button').classList.remove('hidden');
    document.getElementById('logo-container').classList.remove('hidden');
    document.getElementById('searchbar-container').classList.add('hidden');
}