/**
 * ===============================
 * UTILITAIRES : Fonctions communes
 * ===============================
 */

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
window.DashboardUtils = {
    getCookie,
    toggleUserInfo
};
