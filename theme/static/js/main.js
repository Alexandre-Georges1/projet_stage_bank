/**
 * ===============================
 * MAIN : Point d'entrée principal du dashboard
 * ===============================
 */

// Fonction principale d'initialisation
function initDashboard() {
    // Initialiser le système de notifications en premier
    if (window.NotificationSystem) {
        window.NotificationSystem.init();
    }

    // Initialiser les modales modernes
    if (window.DashboardModal) {
        window.DashboardModal.init();
    }

    // Initialiser les modules de base
    if (window.DashboardCore) {
        window.DashboardCore.initNavigation();
        window.DashboardCore.initSidebar();
        window.DashboardCore.initSearch();
        window.DashboardCore.initLogout();
    }

    // Initialiser les notifications (ancien système)
    if (window.DashboardNotifications) {
        window.DashboardNotifications.initNotifications();
    }

    // Initialiser la gestion des PCs (après les notifications)
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
    
    // Test du système de notifications après initialisation
    setTimeout(() => {
        if (window.NotificationSystem) {
            // Fonction de test disponible globalement
            window.testNotifications = function() {
                window.NotificationSystem.success('Test de notification de succès', { title: 'Test' });
                setTimeout(() => {
                    window.NotificationSystem.error('Test de notification d\'erreur', { title: 'Test' });
                }, 1000);
                setTimeout(() => {
                    window.NotificationSystem.warning('Test de notification d\'avertissement', { title: 'Test' });
                }, 2000);
                setTimeout(() => {
                    window.NotificationSystem.info('Test de notification d\'information', { title: 'Test' });
                }, 3000);
            };
        } 

        // Diagnostic des modales
        setTimeout(() => {
            diagnoseModeaux();
        }, 1000);
    }, 500);
});

// Fonction de diagnostic des modales
function diagnoseModeaux() {
    
    // Chercher toutes les modales dans le DOM
    const modalOverlays = document.querySelectorAll('.modal-overlay, .modern-modal-overlay');
    const hiddenModals = document.querySelectorAll('.modal-overlay.hidden, .modern-modal-overlay.hidden');
    const visibleModals = document.querySelectorAll('.modal-overlay:not(.hidden), .modern-modal-overlay:not(.hidden)');
  
    // Analyser chaque modale
    modalOverlays.forEach((modal, index) => {
        const isHidden = modal.classList.contains('hidden');
        const zIndex = window.getComputedStyle(modal).zIndex;
        const display = window.getComputedStyle(modal).display;
        const position = window.getComputedStyle(modal).position;
        
     
        // Vérifier les problèmes potentiels
        if (parseInt(zIndex) < 1000 && !isHidden) {
            console.warn(`⚠️ Z-index faible détecté sur modale ${modal.id}`);
        }
        if (position !== 'fixed' && !isHidden) {
            console.warn(`⚠️ Position non-fixed détectée sur modale ${modal.id}`);
        }
    });
    
    // Fonctions de test globales
    window.testModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 3000);
        } else {
            console.error(`❌ Modale non trouvée: ${modalId}`);
        }
    };
    
    window.listModals = function() {
        const modals = document.querySelectorAll('.modal-overlay, .modern-modal-overlay')
    };
}

// Export pour utilisation globale
window.DashboardMain = {
    initDashboard
};
