/**
 * ===============================
 * MAIN : Point d'entrée principal du dashboard
 * ===============================
 */

console.log("[DEBUG] main.js chargé !");

// Fonction principale d'initialisation
function initDashboard() {
    console.log("[DEBUG] Initialisation du dashboard...");

    // Initialiser les modules de base
    if (window.DashboardCore) {
        window.DashboardCore.initNavigation();
        window.DashboardCore.initSidebar();
        window.DashboardCore.initSearch();
        window.DashboardCore.initLogout();
        console.log("[DEBUG] DashboardCore initialisé");
    }

    // Initialiser les notifications
    if (window.DashboardNotifications) {
        window.DashboardNotifications.initNotifications();
        console.log("[DEBUG] Notifications initialisées");
    }

    // Initialiser la gestion des PCs
    if (window.DashboardPcManagement) {
        window.DashboardPcManagement.initPcManagement();
        console.log("[DEBUG] PC Management initialisé");
    }

    // Initialiser la gestion des utilisateurs
    if (window.DashboardUserManagement) {
        window.DashboardUserManagement.initUserManagement();
        console.log("[DEBUG] User Management initialisé");
    }

    // Initialiser la gestion des rachats
    if (window.DashboardRachatManagement) {
        window.DashboardRachatManagement.initRachatManagement();
        console.log("[DEBUG] Rachat Management initialisé");
    }

    // Initialiser la gestion des bordereaux
    if (window.DashboardBordereauManagement) {
        window.DashboardBordereauManagement.initBordereauManagement();
        console.log("[DEBUG] Bordereau Management initialisé");
    }

    console.log("[DEBUG] Dashboard entièrement initialisé !");
}

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log("[DEBUG] DOMContentLoaded - Démarrage de l'initialisation");
    
    // Petit délai pour s'assurer que tous les modules sont chargés
    setTimeout(initDashboard, 100);
});

// Export pour utilisation globale
window.DashboardMain = {
    initDashboard
};
