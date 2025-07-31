/**
 * Module de gestion des demandes d'achat de périphériques
 * Gère le formulaire de demande et les interactions utilisateur
 */

class AchatPeripheriquesManager {
    constructor() {
        this.demandeForm = null;
        this.submitButton = null;
        this.materielSelect = null;
        this.commentairesField = null;
        
        this.init();
    }

    /**
     * Initialise le gestionnaire de demandes d'achat
     */
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initElements();
            
            // Vérifier que tous les éléments sont présents
            if (this.checkRequiredElements()) {
                this.setupEventListeners();
            } else {
                console.error(' AchatPeripheriquesManager: Échec de l\'initialisation - éléments manquants');
            }
        });
    }

    /**
     * Initialise les éléments DOM
     */
    initElements() {
        this.demandeForm = document.getElementById('demandeAchatPieceForm');
        this.submitButton = this.demandeForm ? this.demandeForm.querySelector('button[type="submit"]') : null;
        this.materielSelect = document.getElementById('demandeAchatMateriel');
        this.commentairesField = document.getElementById('commentairesAchat');
    }

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        this.setupFormSubmission();
    }

    /**
     * Gère la soumission du formulaire de demande
     */
    setupFormSubmission() {
        if (this.demandeForm) {
            this.demandeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }
    }

    /**
     * Traite la soumission du formulaire
     */
    async handleFormSubmit() {
        try {
            if (!this.validateForm()) {
                return;
            }
            this.debugFormData();
            const formData = new FormData(this.demandeForm);
            this.showLoadingState(true);
            const response = await fetch(window.demandeAchatPeripheriquesUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': this.getCSRFToken()
                }
            });

            const data = await response.json();
            this.handleResponse(data, response.ok);

        } catch (error) {
            this.showError('Une erreur est survenue lors de l\'envoi de la demande.');
        } finally {
            this.showLoadingState(false);
        }
    }

    /**
     * Valide le formulaire côté client
     */
    validateForm() {
        const requiredFields = [
            { element: this.materielSelect, message: 'Veuillez sélectionner un matériel.' }
        ];

        for (const field of requiredFields) {
            if (!field.element || !field.element.value) {
                this.showError(field.message);
                field.element?.focus();
                return false;
            }
        }
        return true;
    }

    /**
     * Traite la réponse du serveur
     */
    handleResponse(data, isSuccess) {
        if (isSuccess && data.message) {
            this.showSuccess(data.message);
            this.resetForm();
            
            // Délai avant rechargement pour que l'utilisateur voie le message
            setTimeout(() => {
                if (confirm('Demande d\'achat envoyée avec succès ! Souhaitez-vous recharger la page ?')) {
                    location.reload();
                }
            }, 2000);
        } else if (data.error) {
            this.showError(data.error);
        } else {
            this.showError('Une erreur inattendue est survenue.');
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Créer ou réutiliser un conteneur de notification
        let notificationContainer = document.getElementById('achat-notification-container');
        
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'achat-notification-container';
            notificationContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(notificationContainer);
        }
        
        // Créer la notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            padding: 15px 20px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            animation: slideIn 0.3s ease-out;
            border-left: 4px solid;
            background: white;
        `;
        
        // Définir les couleurs selon le type
        const styles = {
            success: {
                borderColor: '#28a745',
                backgroundColor: '#d4edda',
                color: '#155724',
                icon: '✅'
            },
            error: {
                borderColor: '#dc3545',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                icon: '❌'
            },
            info: {
                borderColor: '#17a2b8',
                backgroundColor: '#d1ecf1',
                color: '#0c5460',
                icon: 'ℹ️'
            }
        };
        
        const style = styles[type] || styles.info;
        notification.style.borderLeftColor = style.borderColor;
        notification.style.backgroundColor = style.backgroundColor;
        notification.style.color = style.color;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 16px;">${style.icon}</span>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="margin-left: auto; background: none; border: none; font-size: 18px; 
                               cursor: pointer; color: ${style.color}; opacity: 0.7;">&times;</button>
            </div>
        `;
        
        // Ajouter les styles d'animation si ce n'est pas déjà fait
        if (!document.getElementById('achat-notification-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'achat-notification-styles';
            styleSheet.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
    
        notificationContainer.appendChild(notification);
        const autoRemoveDelay = type === 'success' ? 5000 : 8000;
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, autoRemoveDelay);
    }

    showLoadingState(isLoading) {
        if (this.submitButton) {
            if (isLoading) {
                this.submitButton.dataset.originalText = this.submitButton.innerHTML;
                
                this.submitButton.disabled = true;
                this.submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
                this.submitButton.style.opacity = '0.7';
                this.submitButton.style.cursor = 'not-allowed';
                this.submitButton.classList.add('loading');
            } else {
                // Restaurer l'état original
                this.submitButton.innerHTML = this.submitButton.dataset.originalText || 'Faire la demande';
                this.submitButton.style.opacity = '1';
                this.submitButton.style.cursor = 'pointer';
                this.submitButton.disabled = false; 
                this.submitButton.classList.remove('loading');
            }
        }
    }
       resetForm() {
        if (this.demandeForm) {
            this.demandeForm.reset();
        }
    }
    getCSRFToken() {
        const csrfElement = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfElement ? csrfElement.value : '';
    }
    debugFormData() {
        if (this.demandeForm) {
            const formData = new FormData(this.demandeForm);
            const debugData = {};
            
            for (let [key, value] of formData.entries()) {
                debugData[key] = value;
            }
        }
    }

    /**
     * Vérifie si tous les éléments requis sont présents
     */
    checkRequiredElements() {
        const elements = {
            'Formulaire': this.demandeForm,
            'Bouton de soumission': this.submitButton,
            'Sélecteur de matériel': this.materielSelect
        };

        let allPresent = true;
        return allPresent;
    }
}

// Initialisation automatique du gestionnaire d'achat de périphériques
window.achatPeripheriquesManager = new AchatPeripheriquesManager();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AchatPeripheriquesManager;
}
