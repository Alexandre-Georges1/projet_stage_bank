/**
 * ===============================
 * MAIN : Point d'entrée principal du dashboard
 * ===============================
 */


// Fonction principale d'initialisation
function initDashboard() {
    

    // Initialiser les modules de base
    if (window.DashboardCore) {
        window.DashboardCore.initNavigation();
        window.DashboardCore.initSidebar();
        window.DashboardCore.initSearch();
        window.DashboardCore.initLogout();
      
    }

    // Initialiser les notifications
    if (window.DashboardNotifications) {
        window.DashboardNotifications.initNotifications();
    
    }

    // Initialiser la gestion des PCs
    if (window.DashboardPcManagement) {
        window.DashboardPcManagement.initPcManagement();
      
    }

    // Initialiser la gestion des utilisateurs
    if (window.DashboardUserManagement) {
        window.DashboardUserManagement.initUserManagement();
   
    }

    // Initialiser la gestion des rachats
    if (window.DashboardRachatManagement) {
        window.DashboardRachatManagement.initRachatManagement();
         
    }

    // Initialiser la gestion des bordereaux
    if (window.DashboardBordereauManagement) {
        window.DashboardBordereauManagement.initBordereauManagement();
     
    }
}

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initDashboard, 100);
});

// Export pour utilisation globale
window.DashboardMain = {
    initDashboard
};
