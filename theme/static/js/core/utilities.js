/**
 * ===============================
 * UTILITAIRES : Fonctions communes
 * ===============================
 */

// Fonction pour récupérer le token CSRF
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Fonction pour afficher les informations utilisateur
function toggleUserInfo() {
    const userInfoDropdown = document.querySelector('.user-info-dropdown');
    if (userInfoDropdown) {
        userInfoDropdown.style.display = userInfoDropdown.style.display === 'none' ? 'flex' : 'none';
    }
}

// Export des fonctions pour utilisation dans d'autres modules
window.DashboardUtils = {
    getCookie,
    toggleUserInfo
};
