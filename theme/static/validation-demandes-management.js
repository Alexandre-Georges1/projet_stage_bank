/**
 * Gestionnaire des validations de demandes de rachat
 */
class ValidationDemandeManager {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Gestionnaire pour les boutons d'approbation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-valider-demande')) {
                const demandeId = e.target.dataset.demandeId;
                this.validerDemande(demandeId, 'approuve', e.target);
            }
        });

        // Gestionnaire pour les boutons de refus
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-refuser-demande')) {
                const demandeId = e.target.dataset.demandeId;
                this.validerDemande(demandeId, 'refuse', e.target);
            }
        });
    }

    async validerDemande(demandeId, statut, buttonElement) {
        const actionText = statut === 'approuve' ? 'approuver' : 'refuser';
        
        if (!confirm(`Êtes-vous sûr de vouloir ${actionText} cette demande ?`)) {
            return;
        }

        try {
            // Désactiver le bouton pendant le traitement
            buttonElement.disabled = true;
            
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            
            const response = await fetch('/gerer_demandes_achat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    demande_id: demandeId,
                    statut: statut
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification(data.message, 'success');
                // Recharger la page pour mettre à jour les données
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                this.showNotification(data.error || 'Erreur lors de la validation', 'error');
                buttonElement.disabled = false;
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur de connexion', 'error');
            buttonElement.disabled = false;
        }
    }

    showNotification(message, type = 'info') {
        // Créer une notification temporaire
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            z-index: 9999;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;

        // Couleurs selon le type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#28a745';
                break;
            case 'error':
                notification.style.backgroundColor = '#dc3545';
                break;
            case 'warning':
                notification.style.backgroundColor = '#ffc107';
                notification.style.color = '#212529';
                break;
            default:
                notification.style.backgroundColor = '#17a2b8';
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        // Supprimer la notification après 3 secondes
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Animation CSS pour les notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialiser le gestionnaire quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    new ValidationDemandeManager();
});
