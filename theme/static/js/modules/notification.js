/* ========================================
   SYSTÈME DE NOTIFICATIONS MODERNES
======================================== */

// Configuration par défaut
const NOTIFICATION_CONFIG = {
    position: 'top-right', // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
    duration: 4000, // durée en millisecondes
    maxNotifications: 5, // nombre maximum de notifications affichées simultanément
    animations: {
        enter: 'slideIn',
        exit: 'slideOut'
    }
};

// Container pour les notifications
let notificationContainer = null;

// Queue des notifications
let notificationQueue = [];
let activeNotifications = [];

// Types de notifications disponibles
const NOTIFICATION_TYPES = {
    success: {
        icon: 'check-circle',
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        title: 'Succès'
    },
    error: {
        icon: 'exclamation-circle',
        color: '#ef4444',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        title: 'Erreur'
    },
    warning: {
        icon: 'exclamation-triangle',
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        title: 'Attention'
    },
    info: {
        icon: 'info-circle',
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        title: 'Information'
    },
    loading: {
        icon: 'spinner fa-spin',
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        title: 'Chargement'
    }
};

// Créer le container principal des notifications
function createNotificationContainer() {
    if (notificationContainer) return notificationContainer;

    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.className = `notification-container position-${NOTIFICATION_CONFIG.position}`;
    
    // Styles du container
    const containerStyles = getContainerStyles();
    notificationContainer.style.cssText = containerStyles;
    
    document.body.appendChild(notificationContainer);
    return notificationContainer;
}

// Obtenir les styles du container selon la position
function getContainerStyles() {
    const baseStyles = `
        position: fixed;
        z-index: 25000;
        pointer-events: none;
        max-width: 400px;
        width: 100%;
    `;

    const positionStyles = {
        'top-right': 'top: 20px; right: 20px;',
        'top-left': 'top: 20px; left: 20px;',
        'bottom-right': 'bottom: 20px; right: 20px;',
        'bottom-left': 'bottom: 20px; left: 20px;',
        'top-center': 'top: 20px; left: 50%; transform: translateX(-50%);',
        'bottom-center': 'bottom: 20px; left: 50%; transform: translateX(-50%);'
    };

    return baseStyles + (positionStyles[NOTIFICATION_CONFIG.position] || positionStyles['top-right']);
}

// Fonction principale pour afficher une notification
function showNotification(message, type = 'info', options = {}) {
    const config = { ...NOTIFICATION_CONFIG, ...options };
    const notificationType = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;
    
    // Créer l'objet notification
    const notification = {
        id: generateNotificationId(),
        message,
        type,
        config,
        notificationType,
        timestamp: Date.now()
    };

    // Ajouter à la queue
    notificationQueue.push(notification);
    
    // Traiter la queue
    processNotificationQueue();
    
    return notification.id;
}

// Générer un ID unique pour la notification
function generateNotificationId() {
    return 'notification-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Traiter la queue des notifications
function processNotificationQueue() {
    while (notificationQueue.length > 0 && activeNotifications.length < NOTIFICATION_CONFIG.maxNotifications) {
        const notification = notificationQueue.shift();
        displayNotification(notification);
    }
}

// Afficher une notification
function displayNotification(notification) {
    const container = createNotificationContainer();
    const element = createNotificationElement(notification);
    
    // Ajouter à la liste des notifications actives
    activeNotifications.push({
        ...notification,
        element
    });
    
    // Ajouter au DOM
    container.appendChild(element);
    
    // Animation d'entrée
    requestAnimationFrame(() => {
        element.style.transform = getEntryTransform();
        element.style.opacity = '0';
        
        requestAnimationFrame(() => {
            element.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            element.style.transform = 'translateX(0) translateY(0) scale(1)';
            element.style.opacity = '1';
        });
    });
    
    // Programmer la suppression automatique
    if (notification.config.duration > 0 && notification.type !== 'loading') {
        setTimeout(() => {
            removeNotification(notification.id);
        }, notification.config.duration);
    }
}

// Obtenir la transformation d'entrée selon la position
function getEntryTransform() {
    const position = NOTIFICATION_CONFIG.position;
    
    if (position.includes('right')) {
        return 'translateX(400px) scale(0.8)';
    } else if (position.includes('left')) {
        return 'translateX(-400px) scale(0.8)';
    } else if (position.includes('top')) {
        return 'translateY(-100px) scale(0.8)';
    } else {
        return 'translateY(100px) scale(0.8)';
    }
}

// Créer l'élément DOM de la notification
function createNotificationElement(notification) {
    const element = document.createElement('div');
    element.className = `modern-notification notification-${notification.type}`;
    element.id = notification.id;
    element.style.cssText = getNotificationStyles(notification);
    
    const hasTitle = notification.config.title !== false;
    const title = notification.config.title || notification.notificationType.title;
    
    element.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <i class="fas fa-${notification.notificationType.icon}"></i>
            </div>
            <div class="notification-text">
                ${hasTitle ? `<div class="notification-title">${title}</div>` : ''}
                <div class="notification-message">${notification.message}</div>
            </div>
            ${notification.type !== 'loading' ? `
                <button class="notification-close" onclick="NotificationSystem.remove('${notification.id}')">
                    <i class="fas fa-times"></i>
                </button>
            ` : ''}
        </div>
        ${notification.config.progress ? '<div class="notification-progress"><div class="notification-progress-bar"></div></div>' : ''}
    `;
    
    return element;
}

// Obtenir les styles de la notification
function getNotificationStyles(notification) {
    return `
        background: ${notification.notificationType.gradient};
        color: white;
        padding: 16px 20px;
        margin-bottom: 12px;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        pointer-events: auto;
        cursor: pointer;
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
        font-weight: 500;
        min-width: 300px;
        max-width: 400px;
        word-wrap: break-word;
    `;
}

// Supprimer une notification
function removeNotification(notificationId) {
    const index = activeNotifications.findIndex(n => n.id === notificationId);
    if (index === -1) return;
    
    const notification = activeNotifications[index];
    const element = notification.element;
    
    // Animation de sortie
    element.style.transition = 'all 0.3s ease-out';
    element.style.transform = getExitTransform();
    element.style.opacity = '0';
    
    setTimeout(() => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
        
        // Retirer de la liste des notifications actives
        activeNotifications.splice(index, 1);
        
        // Traiter la queue si il y a des notifications en attente
        processNotificationQueue();
    }, 300);
}

// Obtenir la transformation de sortie
function getExitTransform() {
    const position = NOTIFICATION_CONFIG.position;
    
    if (position.includes('right')) {
        return 'translateX(400px) scale(0.8)';
    } else if (position.includes('left')) {
        return 'translateX(-400px) scale(0.8)';
    } else {
        return 'translateY(-100px) scale(0.8)';
    }
}

// Supprimer toutes les notifications
function clearAllNotifications() {
    activeNotifications.forEach(notification => {
        removeNotification(notification.id);
    });
    notificationQueue = [];
}

// Mettre à jour une notification existante
function updateNotification(notificationId, newMessage, newType) {
    const notification = activeNotifications.find(n => n.id === notificationId);
    if (!notification) return false;
    
    const element = notification.element;
    const messageElement = element.querySelector('.notification-message');
    const iconElement = element.querySelector('.notification-icon i');
    
    if (newMessage) {
        messageElement.textContent = newMessage;
        notification.message = newMessage;
    }
    
    if (newType && NOTIFICATION_TYPES[newType]) {
        notification.type = newType;
        notification.notificationType = NOTIFICATION_TYPES[newType];
        
        // Mettre à jour l'icône
        iconElement.className = `fas fa-${notification.notificationType.icon}`;
        
        // Mettre à jour le style
        element.style.background = notification.notificationType.gradient;
        element.className = `modern-notification notification-${newType}`;
    }
    
    return true;
}

// Fonctions de raccourci pour les types courants
const success = (message, options) => showNotification(message, 'success', options);
const error = (message, options) => showNotification(message, 'error', options);
const warning = (message, options) => showNotification(message, 'warning', options);
const info = (message, options) => showNotification(message, 'info', options);
const loading = (message, options) => showNotification(message, 'loading', { duration: 0, ...options });

// Remplacer les alertes JavaScript par défaut
function replaceNativeAlerts() {
    // Remplacer alert()
    window.originalAlert = window.alert;
    window.alert = function(message) {
        info(message, { title: 'Alert' });
    };
    
    // Remplacer confirm() - retourne toujours true pour compatibilité
    window.originalConfirm = window.confirm;
    window.confirm = function(message) {
        warning(message, { title: 'Confirmation', duration: 6000 });
        return true; // Pour compatibilité, toujours retourner true
    };
}

// Restaurer les alertes JavaScript natives
function restoreNativeAlerts() {
    if (window.originalAlert) {
        window.alert = window.originalAlert;
    }
    if (window.originalConfirm) {
        window.confirm = window.originalConfirm;
    }
}

// Initialiser le système de notifications
function initNotificationSystem() {
    // Injecter les styles CSS
    injectNotificationStyles();
    
    // Remplacer les alertes natives par défaut
    replaceNativeAlerts();
    
    // Créer le container
    createNotificationContainer();
}

// Injecter les styles CSS
function injectNotificationStyles() {
    const styles = `
        .notification-container {
            font-family: 'Poppins', sans-serif;
        }
        
        .modern-notification {
            position: relative;
            overflow: hidden;
        }
        
        .notification-content {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            position: relative;
            z-index: 1;
        }
        
        .notification-icon {
            flex-shrink: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .notification-icon i {
            font-size: 16px;
        }
        
        .notification-text {
            flex: 1;
            min-width: 0;
        }
        
        .notification-title {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 4px;
            line-height: 1.2;
        }
        
        .notification-message {
            font-weight: 400;
            font-size: 13px;
            line-height: 1.4;
            opacity: 0.95;
        }
        
        .notification-close {
            flex-shrink: 0;
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            opacity: 0.7;
            transition: opacity 0.2s ease;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .notification-close:hover {
            opacity: 1;
            background: rgba(255, 255, 255, 0.1);
        }
        
        .notification-close i {
            font-size: 12px;
        }
        
        .notification-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: rgba(255, 255, 255, 0.2);
            overflow: hidden;
        }
        
        .notification-progress-bar {
            height: 100%;
            background: rgba(255, 255, 255, 0.8);
            width: 0%;
            transition: width 0.1s ease;
        }
        
        .modern-notification:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2), 0 6px 15px rgba(0, 0, 0, 0.15) !important;
        }
        
        @keyframes notificationSlide {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @media (max-width: 480px) {
            .notification-container {
                left: 10px !important;
                right: 10px !important;
                max-width: none !important;
            }
            
            .modern-notification {
                min-width: auto !important;
                max-width: none !important;
            }
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    initNotificationSystem();
});

// Export pour utilisation globale
window.NotificationSystem = {
    show: showNotification,
    success,
    error,
    warning,
    info,
    loading,
    remove: removeNotification,
    clear: clearAllNotifications,
    update: updateNotification,
    config: NOTIFICATION_CONFIG,
    init: initNotificationSystem,
    replaceAlerts: replaceNativeAlerts,
    restoreAlerts: restoreNativeAlerts
};

// Alias pour raccourcis
window.notify = showNotification;
window.notifySuccess = success;
window.notifyError = error;
window.notifyWarning = warning;
window.notifyInfo = info;
window.notifyLoading = loading;
