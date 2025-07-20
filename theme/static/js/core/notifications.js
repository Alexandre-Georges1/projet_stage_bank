/**
 * ===============================
 * NOTIFICATIONS : Gestion du système de notifications
 * ===============================
 */

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.notificationBtn = document.getElementById('notificationBtn');
        this.notificationBadge = document.getElementById('notificationBadge');
        this.notificationDropdown = document.getElementById('notificationDropdown');
        this.notificationList = document.getElementById('notificationList');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        
        this.initEventListeners();
        this.updateBadge();
    }

    initEventListeners() {
        if (!this.notificationBtn) return;

        // Toggle dropdown au clic sur la cloche
        this.notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Fermer le dropdown si on clique ailleurs
        document.addEventListener('click', (e) => {
            if (!this.notificationBtn.contains(e.target) && 
                this.notificationDropdown && !this.notificationDropdown.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Effacer toutes les notifications
        if (this.clearAllBtn) {
            this.clearAllBtn.addEventListener('click', () => {
                this.clearAllNotifications();
            });
        }
    }

    toggleDropdown() {
        if (!this.notificationDropdown) return;
        
        this.notificationDropdown.classList.toggle('show');
        // Marquer toutes les notifications comme lues quand on ouvre le dropdown
        if (this.notificationDropdown.classList.contains('show')) {
            this.markAllAsRead();
        }
    }

    closeDropdown() {
        if (this.notificationDropdown) {
            this.notificationDropdown.classList.remove('show');
        }
    }

    addNotification(type, message, time = null, id = null, sender_name = null, sender_email = null) {
        const notification = {
            id: id || Date.now(),
            type: type,
            message: message || this.getDefaultMessage(type),
            time: time || this.formatTime(new Date()),
            sender_name: sender_name || 'Inconnu',
            sender_email: sender_email || '',
            read: false
        };

        this.notifications.unshift(notification);
        this.updateBadge();
        this.renderNotifications();
        
        // Animation du badge
        if (this.notificationBadge) {
            this.notificationBadge.style.animation = 'none';
            setTimeout(() => {
                this.notificationBadge.style.animation = 'pulse 2s infinite';
            }, 10);
        }
    }

    getDefaultMessage(type) {
        const messages = {
            info: 'Nouvelle information disponible',
            success: 'Opération réussie avec succès',
            warning: 'Attention requise',
            error: 'Une erreur s\'est produite'
        };
        return messages[type] || 'Nouvelle notification';
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'À l\'instant';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} h`;
        return `${Math.floor(diff / 86400000)} j`;
    }

    updateBadge() {
        if (!this.notificationBadge) return;
        
        const unreadCount = this.notifications.filter(n => !n.read).length;
        this.notificationBadge.textContent = unreadCount;
        this.notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.updateBadge();
        this.renderNotifications();
    }

    clearAllNotifications() {
        this.notifications = [];
        this.updateBadge();
        this.renderNotifications();
    }

    removeNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.updateBadge();
        this.renderNotifications();
    }

    async markNotificationAsRead(notificationId) {
        try {
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
            if (!csrfToken || !window.markNotificationAsReadUrl) return;

            const url = window.markNotificationAsReadUrl.replace('0', notificationId);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            if (response.ok) {
                // Mettre à jour le statut dans la liste locale des notifications
                const notificationIndex = this.notifications.findIndex(n => n.id === notificationId);
                if (notificationIndex !== -1) {
                    this.notifications[notificationIndex].read = true;
                    this.updateBadge();
                    this.renderNotifications(); // Re-rendre la liste pour mettre à jour l'affichage
                }
            } else {
                console.error('Erreur lors du marquage de la notification comme lue:', await response.json());
            }
        } catch (error) {
            console.error('Erreur réseau lors du marquage de la notification comme lue:', error);
        }
    }

    renderNotifications() {
        if (!this.notificationList) return;

        if (this.notifications.length === 0) {
            this.notificationList.innerHTML = `
                <div class="empty-state">
                    <i class='bx bx-bell-off'></i>
                    <div>Aucune notification</div>
                </div>
            `;
            return;
        }

        this.notificationList.innerHTML = this.notifications.map(notification => `
            <div class="notification-item" style="${!notification.read ? 'font-weight: bold;' : ''}"
                 onclick="window.notificationManager?.markNotificationAsRead(${notification.id})">
                <div class="notification-content">
                    <div class="notification-icon ${notification.type}">
                        <i class='bx ${this.getIconClass(notification.type)}'></i>
                    </div>
                    <div class="notification-details">
                        <div class="notification-message">
                            <strong>${notification.message}</strong><br>
                            De : ${notification.sender_name || 'Inconnu'} ${notification.sender_email ? `(${notification.sender_email})` : ''}
                        </div>
                        <div class="notification-time">${notification.time}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getIconClass(type) {
        const icons = {
            info: 'bx-info-circle',
            success: 'bx-check-circle',
            warning: 'bx-error-circle',
            error: 'bx-x-circle'
        };
        return icons[type] || 'bx-bell';
    }
}

// Fonction d'initialisation des notifications
function initNotifications() {
    // Initialiser le gestionnaire de notifications
    window.notificationManager = new NotificationManager();

    // Charger les notifications depuis une variable globale générée par Django
    if (window.notificationsData && Array.isArray(window.notificationsData)) {
        console.log('Notifications Django trouvées :', window.notificationsData);
        window.notificationManager.clearAllNotifications();
        window.notificationsData.forEach(notif => {
            window.notificationManager.addNotification(
                notif.type,
                notif.message,
                notif.time,
                notif.id,
                notif.sender_name,
                notif.sender_email
            );
        });
    } else {
        console.warn('Aucune notification Django trouvée dans window.notificationsData');
    }
}

// Export des fonctions pour utilisation dans d'autres modules
window.DashboardNotifications = {
    NotificationManager,
    initNotifications
};
