/**
 * Module de gestion des restitutions de PC
 * Gère les formulaires de restitution et les interactions utilisateur
 */
class RestitutionManager {
    constructor() {
        this.restituerForm = null;
        this.confirmerCheckbox = null;
        this.submitButton = null;
        this.motifSelect = null;
        this.autreMotifGroup = null;
        
        this.init();
    }

    /**
     * Initialise le gestionnaire de restitution
     */
    init() { 
        // Vérifier si le DOM est déjà chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initElements();
                this.performInitialization();
            });
        } else {
            this.initElements();
            this.performInitialization();
        }
    }
    performInitialization() {
        // Vérifier que tous les éléments sont présents
        if (this.checkRequiredElements()) {
            this.setupEventListeners();
        } else {
            
      // Retry après 1 seconde au cas où les éléments ne seraient pas encore disponibles
            setTimeout(() => {
                this.initElements();
                if (this.checkRequiredElements()) {
                    this.setupEventListeners();
                } else {
                    console.error('❌ RestitutionManager: Échec définitif de l\'initialisation');
                }
            }, 1000);
        }
    }

    /**
     * Initialise les éléments DOM
     */
    initElements() { 
        this.restituerForm = document.getElementById('restituerPcForm');
        this.confirmerCheckbox = document.getElementById('confirmerRestitution');
        this.submitButton = document.querySelector('.btn-restituer');   
        this.motifSelect = document.getElementById('restituerMotif');   
        this.autreMotifGroup = document.getElementById('autreMotifGroup');
    }

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        this.setupConfirmationCheckbox();
        this.setupMotifSelection();
        this.setupFormSubmission();
    }

    /**
     * Gère l'activation/désactivation du bouton selon la checkbox
     */
    setupConfirmationCheckbox() {
        if (this.confirmerCheckbox && this.submitButton) {
            this.confirmerCheckbox.addEventListener('change', () => {
                this.submitButton.disabled = !this.confirmerCheckbox.checked;
            });
        }
    }

    /**
     * Gère l'affichage conditionnel du champ "Autre motif"
     */
    setupMotifSelection() {
        if (this.motifSelect && this.autreMotifGroup) {
            this.motifSelect.addEventListener('change', () => {
                if (this.motifSelect.value === 'Autre') {
                    this.autreMotifGroup.style.display = 'block';
                } else {
                    this.autreMotifGroup.style.display = 'none';
                }
            });
        }
    }

    /**
     * Gère la soumission du formulaire de restitution
     */
    setupFormSubmission() {
        if (this.restituerForm) {
            this.restituerForm.addEventListener('submit', (e) => {
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
            // Vérifier l'URL
            if (!window.restituerPcUrl) {
                this.showError('Configuration manquante: URL de restitution non définie.');
                return;
            } 
            // Validation côté client
            if (!this.validateForm()) {
                return;
            }

            // Debug : afficher les données du formulaire
            this.debugFormData();

            // Préparation des données
            const formData = new FormData(this.restituerForm);
            
            // Si le motif n'est pas "Autre", supprimer le champ autre_motif
            const motif = formData.get('motif');
            if (motif !== 'Autre') {
                formData.delete('autre_motif');
            }
        
            this.showLoadingState(true);

            // Envoi de la requête
            const response = await fetch(window.restituerPcUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': this.getCSRFToken()
                }
            });

            const data = await response.json();

            // Traitement de la réponse
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
            { element: this.motifSelect, message: 'Veuillez sélectionner un motif de restitution.' },
            { element: document.getElementById('dateRestitution'), message: 'Veuillez sélectionner une date de restitution.' },
            { element: this.confirmerCheckbox, message: 'Veuillez confirmer la restitution.' }
        ];

        for (const field of requiredFields) {
            if (!field.element || !field.element.value || (field.element.type === 'checkbox' && !field.element.checked)) {
                this.showError(field.message);
                field.element?.focus();
                return false;
            }
        }

        // Validation spéciale pour "Autre motif"
        if (this.motifSelect.value === 'Autre') {
            const autreMotif = document.getElementById('autreMotif');
            if (!autreMotif || !autreMotif.value.trim()) {
                this.showError('Veuillez préciser le motif de restitution.');
                autreMotif?.focus();
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
            setTimeout(() => {
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
        let notificationContainer = document.getElementById('restitution-notification-container');
        
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'restitution-notification-container';
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
        if (!document.getElementById('restitution-notification-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'restitution-notification-styles';
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
        
        // Ajouter la notification
        notificationContainer.appendChild(notification);
        
        // Auto-suppression après 5 secondes pour les succès, 8 secondes pour les erreurs
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

    /**
     * Gère l'état de chargement
     */
    showLoadingState(isLoading) {
        if (this.submitButton) {
            if (isLoading) {
                // Sauvegarder le texte original
                this.submitButton.dataset.originalText = this.submitButton.innerHTML;
                
                // Afficher l'indicateur de chargement
                this.submitButton.disabled = true;
                this.submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
                this.submitButton.style.opacity = '0.7';
                this.submitButton.style.cursor = 'not-allowed';
                
                // Ajouter une classe pour le style
                this.submitButton.classList.add('loading');
            } else {
                // Restaurer l'état original
                this.submitButton.innerHTML = this.submitButton.dataset.originalText || '<i class="fas fa-undo"></i> Restituer le PC';
                this.submitButton.style.opacity = '1';
                this.submitButton.style.cursor = 'pointer';
                
                // Réactiver seulement si la checkbox est cochée
                this.submitButton.disabled = !this.confirmerCheckbox?.checked;
                
                // Retirer la classe de chargement
                this.submitButton.classList.remove('loading');
            }
        }
    }

    /**
     * Réinitialise le formulaire après succès
     */
    resetForm() {
        if (this.restituerForm) {
            this.restituerForm.reset();
            this.submitButton.disabled = true;
            
            // Masquer le champ "Autre motif" si affiché
            if (this.autreMotifGroup) {
                this.autreMotifGroup.style.display = 'none';
            }
        }
    }

    /**
     * Récupère le token CSRF
     */
    getCSRFToken() {
        const csrfElement = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfElement ? csrfElement.value : '';
    }

    /**
     * Méthode de débogage pour afficher les données du formulaire
     */
    debugFormData() {
        if (this.restituerForm) {
            const formData = new FormData(this.restituerForm);
            const debugData = {};
            
            for (let [key, value] of formData.entries()) {
                debugData[key] = value;
            }
        }
    }
    checkRequiredElements() {
        const elements = {
            'Formulaire': this.restituerForm,
            'Checkbox de confirmation': this.confirmerCheckbox,
            'Bouton de soumission': this.submitButton,
            'Sélecteur de motif': this.motifSelect,
            'Groupe autre motif': this.autreMotifGroup
        };

        let allPresent = true;

        for (const [name, element] of Object.entries(elements)) {
            const isPresent = element !== null;
            if (!isPresent) allPresent = false;
        }
        return allPresent;
    }
}

// Initialisation automatique du gestionnaire de restitution
window.restitutionManager = new RestitutionManager();

// Export pour utilisation en module ES6 si nécessaire
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RestitutionManager;
}
