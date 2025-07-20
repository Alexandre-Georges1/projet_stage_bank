/**
 * ===============================
 * BORDEREAU MANAGEMENT : Gestion des bordereaux
 * ===============================
 */

// Fonction principale d'initialisation de la gestion des bordereaux
function initBordereauManagement() {
    const bordereauButtons = document.querySelectorAll('.btn-bordereau');
    bordereauButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            if (!row) return;

            const rowData = {
                nom: row.children[0]?.textContent || '',
                prenom: row.children[1]?.textContent || '',
                marque: row.children[2]?.textContent || '',
                modele: row.children[3]?.textContent || '',
                numeroSerie: row.children[4]?.textContent || '',
                dateAttribution: row.children[5]?.textContent || '',
                telephone: this.getAttribute('data-telephone') || '',
                email: this.getAttribute('data-email') || '',
                employeId: this.getAttribute('data-employe-id') || ''
            };

            // Remplir les champs de la modale
            const elements = {
                'bordereauDate': `Date : ${rowData.dateAttribution}`,
                'bordereauNom': rowData.nom,
                'bordereauPrenom': rowData.prenom,
                'bordereauSerie': rowData.numeroSerie,
                'bordereauDesc': `${rowData.marque} ${rowData.modele}`,
                'bordereauTelephone': rowData.telephone
            };

            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });

            // Stocker l'ID de l'employé et les informations sur la modale pour l'envoi
            const bordereauModal = document.getElementById('bordereauModal');
            if (bordereauModal) {
                bordereauModal.dataset.employeId = rowData.employeId;
                bordereauModal.dataset.nomEmploye = rowData.nom;
                bordereauModal.dataset.prenomEmploye = rowData.prenom;
                bordereauModal.dataset.marquePc = rowData.marque;
                bordereauModal.dataset.modelePc = rowData.modele;
                bordereauModal.dataset.numeroSeriePc = rowData.numeroSerie;
                bordereauModal.dataset.telephoneEmploye = rowData.telephone;

                // Attacher l'écouteur d'événements au bouton Envoyer demande
                const btnEnvoyerDemande = bordereauModal.querySelector('.btn-Envoyer-Demande');
                if (btnEnvoyerDemande) {
                    btnEnvoyerDemande.onclick = async function() {
                        await handleEnvoyerDemande(bordereauModal);
                    };
                }

                bordereauModal.classList.remove('hidden');
            }
        });
    });

    // Fermer la modale
    const closeModalBtn = document.querySelector('#bordereauModal .modal-close-button');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            const bordereauModal = document.getElementById('bordereauModal');
            if (bordereauModal) bordereauModal.classList.add('hidden');
        });
    }

    // Télécharger/Imprimer le bordereau
    const downloadBtn = document.getElementById('downloadBordereauBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            handleDownloadBordereau();
        });
    }
}

// Fonction pour gérer l'envoi de la demande
async function handleEnvoyerDemande(bordereauModal) {
    const btnEnvoyerDemande = bordereauModal.querySelector('.btn-Envoyer-Demande');
    
    // Activer l'état de chargement
    showBordereauLoadingState(true, btnEnvoyerDemande);
    
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    
    if (!csrfToken) {
        showBordereauNotification('Token CSRF manquant', 'error');
        showBordereauLoadingState(false, btnEnvoyerDemande);
        return;
    }

    const dataToSend = {
        employe_id: bordereauModal.dataset.employeId,
        nom_employe: bordereauModal.dataset.nomEmploye,
        prenom_employe: bordereauModal.dataset.prenomEmploye,
        marque_pc: bordereauModal.dataset.marquePc,
        modele_pc: bordereauModal.dataset.modelePc,
        numero_serie_pc: bordereauModal.dataset.numeroSeriePc,
        description_pc: bordereauModal.dataset.marquePc + ' ' + bordereauModal.dataset.modelePc,
        telephone_employe: bordereauModal.dataset.telephoneEmploye,
    };

    try {
        const response = await fetch(window.envoyerBordereauEmployeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(dataToSend)
        });

        const result = await response.json();

        if (response.ok) {
            showBordereauNotification(result.message, 'success');
            setTimeout(() => {
                bordereauModal.classList.add('hidden');
            }, 1500);
        } else {
            showBordereauNotification("Erreur lors de l'envoi du bordereau : " + result.error, 'error');
        }
    } catch (error) {
        showBordereauNotification("Une erreur est survenue lors de l'envoi du bordereau.", 'error');
    } finally {
        // Désactiver l'état de chargement
        showBordereauLoadingState(false, btnEnvoyerDemande);
    }
}

// Fonction pour gérer le téléchargement/impression du bordereau
function handleDownloadBordereau() {
    const modal = document.getElementById('bordereauModal');
    const printBtn = document.getElementById('downloadBordereauBtn');
    
    if (!modal || !printBtn) return;

    // Masquer le bouton avant impression
    printBtn.style.display = 'none';
    const printContents = modal.querySelector('.modal-content')?.innerHTML || '';
    const win = window.open('', '', 'height=600,width=800');
    
    if (win) {
        win.document.write('<html><head><title>Bordereau de Livraison</title>');
        win.document.write('<style>@media print {.no-print{display:none!important;}}</style>');
        win.document.write('</head><body>');
        win.document.write(printContents);
        win.document.write('</body></html>');
        win.document.close();
        win.focus();
        
        setTimeout(() => {
            win.print();
            win.close();
            // Réafficher le bouton après impression
            printBtn.style.display = '';
        }, 500);
    }
}

// Fonction pour gérer l'acceptation du bordereau
async function handleAcceptBordereau() {
    const acceptBtn = document.getElementById('acceptBordereauBtn');
    const messageDiv = document.getElementById('messageBordereauAccept');
    
    if (!acceptBtn || !messageDiv) {
        showBordereauNotification("Éléments de la page non trouvés", 'error');
        return;
    }

    // Activer l'état de chargement
    showBordereauLoadingState(true, acceptBtn);

    // Récupérer le token CSRF
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
                     document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
                     getCookie('csrftoken');

    try {
        const response = await fetch('/accepter-bordereau/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({})
        });

        const result = await response.json();

        if (response.ok) {
            // Changer le texte et style du bouton
            acceptBtn.textContent = 'Bordereau accepté';
            acceptBtn.style.backgroundColor = '#28a745';
            acceptBtn.disabled = true;
            
            // Afficher le message de confirmation avec la date
            messageDiv.textContent = `Bordereau lu et accepté le ${result.date_acceptation}`;
            messageDiv.style.display = 'block';
            messageDiv.style.color = '#28a745';
            messageDiv.style.fontWeight = 'bold';
            messageDiv.style.marginTop = '10px';
            
            showBordereauNotification(`Bordereau accepté avec succès le ${result.date_acceptation}`, 'success');
        } else {
            showBordereauNotification("Erreur lors de l'acceptation du bordereau : " + result.error, 'error');
        }
    } catch (error) {
        showBordereauNotification("Une erreur est survenue lors de l'acceptation du bordereau.", 'error');
    } finally {
        // Désactiver l'état de chargement seulement si l'acceptation a échoué
        if (!acceptBtn.disabled) {
            showBordereauLoadingState(false, acceptBtn);
        }
    }
}

// Rendre la fonction accessible globalement
window.handleAcceptBordereau = handleAcceptBordereau;

// Fonction utilitaire pour récupérer les cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Rendre la fonction accessible globalement
window.handleAcceptBordereau = handleAcceptBordereau;

// Fonction pour gérer l'activation du bouton
function toggleAcceptButton() {
    const checkbox = document.getElementById('bordereauCheckbox');
    const button = document.getElementById('acceptBordereauBtn');
    
    if (checkbox && button) {
        button.disabled = !checkbox.checked;
    }
}

// Rendre cette fonction accessible globalement
window.toggleAcceptButton = toggleAcceptButton;

/**
 * Gère l'état de chargement pour les boutons de bordereau
 * @param {boolean} isLoading - État de chargement
 * @param {HTMLElement} submitButton - Bouton de soumission
 */
function showBordereauLoadingState(isLoading, submitButton) {
    if (!submitButton) return;
    
    if (isLoading) {
        // Sauvegarder le texte original
        submitButton.dataset.originalText = submitButton.innerHTML;
        
        // Afficher l'indicateur de chargement
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
        submitButton.style.opacity = '0.7';
        
        // Ajouter une classe pour le style
        submitButton.classList.add('loading');
    } else {
        // Restaurer l'état original
        submitButton.disabled = false;
        submitButton.innerHTML = submitButton.dataset.originalText || 'Envoyer';
        submitButton.style.opacity = '1';
        
        // Retirer la classe de chargement
        submitButton.classList.remove('loading');
    }
}

/**
 * Affiche une notification pour les opérations de bordereau
 * @param {string} message - Message à afficher
 * @param {string} type - Type de notification (success, error, info)
 */
function showBordereauNotification(message, type = 'info') {
    // Créer ou réutiliser un conteneur de notification
    let notificationContainer = document.getElementById('bordereau-notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'bordereau-notification-container';
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
    if (!document.getElementById('bordereau-notification-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'bordereau-notification-styles';
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

// Export des fonctions pour utilisation dans d'autres modules
window.DashboardBordereauManagement = {
    initBordereauManagement,
    handleEnvoyerDemande,
    handleDownloadBordereau,
    handleAcceptBordereau
};
