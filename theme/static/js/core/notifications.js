/**
 * NOTIFICATIONS : Gestion du système de notifications
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
        this.notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

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

        // Délégation: clic sur l'item pour marquer comme lu
        if (this.notificationList) {
            this.notificationList.addEventListener('click', (e) => {
                const item = e.target.closest('.notification-item');
                if (!item || !this.notificationList.contains(item)) return;
                const id = parseInt(item.getAttribute('data-id'));
                const notif = this.notifications.find(n => n.id === id);
                if (!notif || notif.read) return; // déjà lu
                this.markNotificationAsRead(id);
            });
        }
    }

    // ...existing code...
toggleDropdown() {
    if (!this.notificationDropdown || !this.notificationBtn) return;

    const willShow = !this.notificationDropdown.classList.contains('show');
    this.notificationDropdown.classList.toggle('show');

    if (willShow) {
        // Calculer position près de la cloche
        const rect = this.notificationBtn.getBoundingClientRect();
        // marge depuis le haut (scrollY + hauteur bouton + 10px)
        const top = rect.bottom + 10 + window.scrollY;
        const right = window.innerWidth - rect.right - 4;
        this.notificationDropdown.style.top = `${top}px`;
        this.notificationDropdown.style.right = `${right}px`;
    }
}
    closeDropdown() {
        if (this.notificationDropdown) {
            this.notificationDropdown.classList.remove('show');
        }
    }

    addNotification(type, message, time = null, id = null, sender_name = null, sender_email = null, readFlag = false) {
        const notification = {
            id: id || Date.now(),
            type: type,
            message: message || this.getDefaultMessage(type),
            time: time || this.formatTime(new Date()),
            sender_name: sender_name || 'Inconnu',
            sender_email: sender_email || '',
            read: !!readFlag
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

            // Déterminer la boîte de notification à partir du rôle ou d'une variable globale
            const role = (window.connectedUserFonction || '').toUpperCase();
            const box = window.notificationBox || (
                role === 'DOT' ? 'dot' :
                role === 'RDOT' ? 'rdot' :
                role === 'DAF' ? 'daf' :
                (role === 'MG' || role === 'RMG') ? 'mgx' :
                'global'
            );

            const url = window.markNotificationAsReadUrl.replace('0', notificationId) + `?box=${encodeURIComponent(box)}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ box })
            });

            if (response.ok) {
                // Mettre à jour le statut dans la liste locale des notifications
                const notificationIndex = this.notifications.findIndex(n => n.id === notificationId);
                if (notificationIndex !== -1) {
                    this.notifications[notificationIndex].read = true;
                    // Feedback immédiat: basculer la classe dans le DOM si l'élément existe
                    const item = this.notificationList?.querySelector(`.notification-item[data-id='${notificationId}']`);
                    if (item) {
                        item.classList.remove('unread');
                        item.classList.add('read');
                    }
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
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
                <div class="notification-content">
                    <div class="notification-details">
                        <div class="notification-message">
                            ${notification.message}<br>
                            <span>De : ${notification.sender_name || 'Inconnu'} ${notification.sender_email ? `(${notification.sender_email})` : ''}</span>
                        </div>
                        <div class="notification-time">${notification.time}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    
}

function initNotifications() {
    window.notificationManager = new NotificationManager();

    // Charger dynamiquement selon l'URL définie par le template
    if (window.getNotificationsUrl) {
        fetch(window.getNotificationsUrl)
            .then(response => response.json())
            .then(data => {
                window.notificationManager.clearAllNotifications();
                data.forEach(notif => {
                    window.notificationManager.addNotification(
                        notif.type,
                        notif.message,
                        notif.time,
                        notif.id,
                        notif.sender_name,
                        notif.sender_email,
                        // Accepte "read" depuis l'API ou "is_read" depuis le template Django
                        (typeof notif.read !== 'undefined') ? notif.read : !!notif.is_read
                    );
                });
            })
            .catch(error => {
                console.warn('⚠️ Erreur lors du chargement des notifications AJAX:', error);
                // Fallback sur les données Django si AJAX échoue
                if (window.notificationsData && Array.isArray(window.notificationsData)) {
                    window.notificationManager.clearAllNotifications();
                    window.notificationsData.forEach(notif => {
                        window.notificationManager.addNotification(
                            notif.type,
                            notif.message,
                            notif.time,
                            notif.id,
                            notif.sender_name,
                            notif.sender_email,
                            // Fallback: les données du template utilisent généralement "is_read"
                            (typeof notif.read !== 'undefined') ? notif.read : !!notif.is_read
                        );
                    });
                }
            });
    } else if (window.notificationsData && Array.isArray(window.notificationsData)) {
        window.notificationManager.clearAllNotifications();
        window.notificationsData.forEach(notif => {
            window.notificationManager.addNotification(
                notif.type,
                notif.message,
                notif.time,
                notif.id,
                notif.sender_name,
                notif.sender_email,
                (typeof notif.read !== 'undefined') ? notif.read : !!notif.is_read
            );
        });
    } else {
        console.warn('⚠️ Aucune notification trouvée - ni AJAX ni Django');
    }
}
window.DashboardNotifications = {
    NotificationManager,
    initNotifications
};
