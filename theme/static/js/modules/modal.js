/**
 * ===============================
 * MODAL : Gestion des modales modernes
 * ===============================
 */

/* ========================================
   SCRIPTS POUR LES MODALES MODERNES
======================================== */

// Gestion de l'ouverture des modales avec animation
function openModernModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        console.log(`🔓 Ouverture de la modale: ${modalId}`);
        
        // S'assurer que la modale est visible
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        modal.style.zIndex = '20000';
        modal.classList.remove('hidden');
        
        // Animation d'entrée
        const modalContent = modal.querySelector('.modern-modal-content, .modal-content');
        if (modalContent) {
            modalContent.style.transform = 'translateY(-30px) scale(0.8)';
            modalContent.style.opacity = '0';
            
            // Force reflow
            modalContent.offsetHeight;
            
            modalContent.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            modalContent.style.transform = 'translateY(0) scale(1)';
            modalContent.style.opacity = '1';
        }
        
        // Animation des éléments de formulaire
        animateFormElements(modal);
        
        // Bloquer le scroll du body
        document.body.style.overflow = 'hidden';
        
        console.log(`✅ Modale ${modalId} ouverte avec succès`);
    } else {
        console.error(`❌ Modale non trouvée: ${modalId}`);
    }
}

// Gestion de la fermeture des modales avec animation
function closeModernModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        console.log(`🔒 Fermeture de la modale: ${modalId}`);
        
        const modalContent = modal.querySelector('.modern-modal-content, .modal-content');
        
        if (modalContent) {
            modalContent.style.transition = 'all 0.3s ease-out';
            modalContent.style.transform = 'translateY(-30px) scale(0.8)';
            modalContent.style.opacity = '0';
            
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.style.display = 'none';
                modal.style.opacity = '0';
                modal.style.visibility = 'hidden';
                
                // Restaurer le scroll du body
                document.body.style.overflow = '';
                
                console.log(`✅ Modale ${modalId} fermée avec succès`);
            }, 300);
        } else {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            modal.style.opacity = '0';
            modal.style.visibility = 'hidden';
            document.body.style.overflow = '';
            
            console.log(`✅ Modale ${modalId} fermée (sans animation)`);
        }
    } else {
        console.error(`❌ Modale non trouvée pour fermeture: ${modalId}`);
    }
}

// Animation des éléments de formulaire
function animateFormElements(modal) {
    const formGroups = modal.querySelectorAll('.form-group');
    formGroups.forEach((group, index) => {
        group.style.opacity = '0';
        group.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            group.style.transition = 'all 0.5s ease';
            group.style.opacity = '1';
            group.style.transform = 'translateY(0)';
        }, 100 + (index * 100));
    });
}

// Effet de secousse pour les erreurs
function shakeModal(modalId) {
    const modal = document.getElementById(modalId);
    const modalContent = modal?.querySelector('.modern-modal-content');
    
    if (modalContent) {
        modalContent.style.animation = 'modalShake 0.5s ease-in-out';
        setTimeout(() => {
            modalContent.style.animation = '';
        }, 500);
    }
}

// État de chargement pour les boutons
function setButtonLoading(button, loading = true) {
    if (loading) {
        button.classList.add('modern-btn-loading');
        button.disabled = true;
        button.originalContent = button.innerHTML;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Chargement...`;
    } else {
        button.classList.remove('modern-btn-loading');
        button.disabled = false;
        if (button.originalContent) {
            button.innerHTML = button.originalContent;
        }
    }
}

// Notification moderne (utilise le système de notifications global)
function showModernNotification(message, type = 'success') {
    if (window.NotificationSystem) {
        return window.NotificationSystem.show(message, type);
    } else {
        // Fallback si le système de notifications n'est pas chargé
        console.warn('Système de notifications non disponible, utilisation du fallback');
        const notification = document.createElement('div');
        notification.className = `modern-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Styles inline pour la notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 20000;
            background: ${type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
                         type === 'error' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 
                         'linear-gradient(135deg, #10b981 0%, #059669 100%)'};
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            transform: translateX(400px);
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        document.body.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Animation de sortie
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
        
        return null;
    }
}

// Fonction universelle pour ouvrir n'importe quelle modale
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`❌ Modale non trouvée: ${modalId}`);
        return false;
    }
    
    console.log(`🔓 Ouverture universelle de la modale: ${modalId}`);
    
    // Déterminer le type de modale
    const isModernModal = modal.classList.contains('modern-modal-overlay');
    const isOldModal = modal.classList.contains('modal-overlay');
    
    if (isModernModal) {
        openModernModal(modalId);
    } else if (isOldModal) {
        // Ouvrir modale classique
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        modal.style.zIndex = '15000';
        modal.classList.remove('hidden');
        
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.transform = 'translateY(0)';
            modalContent.style.opacity = '1';
        }
        
        document.body.style.overflow = 'hidden';
        console.log(`✅ Modale classique ${modalId} ouverte`);
    } else {
        // Fallback pour modales non typées
        modal.style.display = 'block';
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        modal.style.zIndex = '15000';
        modal.classList.remove('hidden');
        
        console.log(`✅ Modale générique ${modalId} ouverte`);
    }
    
    return true;
}

// Fonction universelle pour fermer n'importe quelle modale
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`❌ Modale non trouvée pour fermeture: ${modalId}`);
        return false;
    }
    
    console.log(`🔒 Fermeture universelle de la modale: ${modalId}`);
    
    // Déterminer le type de modale
    const isModernModal = modal.classList.contains('modern-modal-overlay');
    const isOldModal = modal.classList.contains('modal-overlay');
    
    if (isModernModal) {
        closeModernModal(modalId);
    } else {
        // Fermer modale classique ou générique
        modal.classList.add('hidden');
        modal.style.display = 'none';
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        document.body.style.overflow = '';
        
        console.log(`✅ Modale ${modalId} fermée`);
    }
    
    return true;
}
function initModernModals() {
    // Gérer les clics sur les boutons de fermeture
    document.querySelectorAll('.modern-close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modern-modal-overlay');
            if (modal) {
                closeModernModal(modal.id);
            }
        });
    });
    
    // Fermer les modales en cliquant sur l'overlay
    document.querySelectorAll('.modern-modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModernModal(this.id);
            }
        });
    });
    
    // Gérer la touche Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modern-modal-overlay:not(.hidden)');
            if (openModal) {
                closeModernModal(openModal.id);
            }
        }
    });
    
    // Améliorer les inputs avec des effets visuels
    document.querySelectorAll('.modern-modal-content input, .modern-modal-content select').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentNode.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentNode.classList.remove('focused');
        });
        
        // Effet de validation en temps réel
        input.addEventListener('input', function() {
            if (this.checkValidity()) {
                this.style.borderColor = '#10b981';
                this.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
            } else {
                this.style.borderColor = '#ef4444';
                this.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
            }
        });
    });
    
    // Gestion des formulaires avec loading states
    document.querySelectorAll('.modern-modal-content form').forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                setButtonLoading(submitBtn, true);
                
                // Simuler un délai de traitement (à remplacer par votre logique réelle)
                setTimeout(() => {
                    // setButtonLoading(submitBtn, false);
                }, 2000);
            }
        });
    });

    // Injecter les styles pour les notifications
    const notificationStyles = `
    .modern-notification {
        font-family: 'Poppins', sans-serif;
        font-weight: 500;
        font-size: 14px;
    }

    .modern-notification .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .modern-notification i {
        font-size: 16px;
    }

    .focused {
        transform: translateY(-2px);
        transition: transform 0.2s ease;
    }
    `;

    // Injecter les styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = notificationStyles;
    document.head.appendChild(styleSheet);
}

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    initModernModals();
});

// Export pour utilisation globale
window.DashboardModal = {
    init: initModernModals,
    open: openModernModal,
    close: closeModernModal,
    openModal: openModal,
    closeModal: closeModal,
    shake: shakeModal,
    notify: showModernNotification,
    setLoading: setButtonLoading
};

// Fonctions utilitaires pour les développeurs (rétrocompatibilité)
window.ModernModal = window.DashboardModal;

// Fonctions globales pour faciliter l'utilisation
window.openModal = openModal;
window.closeModal = closeModal;
