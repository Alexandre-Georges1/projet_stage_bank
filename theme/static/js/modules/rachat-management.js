/**
 * ===============================
 * RACHAT MANAGEMENT : Gestion des rachats de PC
 * ===============================
 */

// Fonction pour récupérer les informations du PC de rachat
async function fetchRacheterPcInfo() {
    console.log('fetchRacheterPcInfo déclenchée, envoi de la requête...');
    try {
        const response = await fetch(window.racheterPcUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await response.json();
        const racheterPcRow = document.getElementById('racheterPcRow');
        const noPcAttributedMessage = document.getElementById('noPcAttributedMessage');

        if (response.ok && result.pc_info) {
            const elements = {
                'racheterMarque': result.pc_info.marque,
                'racheterModele': result.pc_info.modele,
                'racheterRam': result.pc_info.ram,
                'racheterDisqueDur': result.pc_info.disque_dur,
                'racheterProcesseur': result.pc_info.processeur,
                'racheterDateAchat': result.pc_info.date_achat,
                'racheterDateAttribution': result.pc_info.date_attribution
            };

            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value || '';
            });

            // Mettre à jour dynamiquement le statut
            const statutCell = document.getElementById('racheterStatut');
            if (statutCell) {
                if (result.pc_info.status === 'en attente') {
                    statutCell.innerHTML = '<span class="statut-en-attente">En attente</span>';
                } else if (result.pc_info.status === 'non envoyé') {
                    statutCell.innerHTML = '<span class="statut-non-envoye">Non envoyé</span>';
                } else {
                    statutCell.innerHTML = `<span>${result.pc_info.status || ''}</span>`;
                }
            }

            if (racheterPcRow) racheterPcRow.classList.remove('hidden');
            if (noPcAttributedMessage) noPcAttributedMessage.classList.add('hidden');
        } else if (response.ok && result.message) {
            // Aucun PC attribué
            if (racheterPcRow) racheterPcRow.classList.add('hidden');
            if (noPcAttributedMessage) {
                noPcAttributedMessage.classList.remove('hidden');
                noPcAttributedMessage.textContent = result.message;
            }
        } else {
            console.error('Erreur lors de la récupération des informations du PC de rachat:', result.error || 'Erreur inconnue');
            showRachatNotification('Une erreur est survenue lors du chargement des informations de rachat: ' + (result.error || 'Veuillez réessayer.'), 'error');
            if (racheterPcRow) racheterPcRow.classList.add('hidden');
            if (noPcAttributedMessage) {
                noPcAttributedMessage.classList.remove('hidden');
                noPcAttributedMessage.textContent = 'Erreur lors du chargement des données.';
            }
        }
    } catch (error) {
        console.error('Erreur réseau lors de la récupération des informations du PC de rachat:', error);
        showRachatNotification('Erreur réseau ou serveur lors du chargement des informations de rachat.', 'error');
        const racheterPcRow = document.getElementById('racheterPcRow');
        const noPcAttributedMessage = document.getElementById('noPcAttributedMessage');
        if (racheterPcRow) racheterPcRow.classList.add('hidden');
        if (noPcAttributedMessage) {
            noPcAttributedMessage.classList.remove('hidden');
            noPcAttributedMessage.textContent = 'Erreur de connexion.';
        }
    }
}

// Fonction principale d'initialisation de la gestion des rachats
function initRachatManagement() {
    styleActionButtons();
    
    const btnRachat = document.querySelector('.btn-Envoyer-Demande_de_rachat');
    if (btnRachat) {
        btnRachat.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Activer l'état de chargement
            showRachatLoadingState(true, btnRachat);
            
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
            
            if (!csrfToken) {
                showRachatNotification('Token CSRF manquant', 'error');
                showRachatLoadingState(false, btnRachat);
                return;
            }

            // Récupérer les infos depuis la ligne du tableau de rachat
            const racheterPcRow = document.getElementById('racheterPcRow');
            const dataElements = {
                nom: document.getElementById('racheterNom'),
                prenom: document.getElementById('racheterPrenom'),
                marque: document.getElementById('racheterMarque'),
                modele: document.getElementById('racheterModele'),
                numeroSerie: document.getElementById('racheterSerie'),
                telephone: document.getElementById('racheterTelephone'),
                dateAchat: document.getElementById('racheterDateAchat')
            };

            const dataToSend = {
                employe_id: racheterPcRow?.getAttribute('data-employe-id'),
                nom_employe: dataElements.nom?.textContent || '',
                prenom_employe: dataElements.prenom?.textContent || '',
                marque_pc: dataElements.marque?.textContent || '',
                modele_pc: dataElements.modele?.textContent || '',
                numero_serie_pc: dataElements.numeroSerie?.textContent || '',
                telephone_employe: dataElements.telephone?.textContent || '',
                date_achat: dataElements.dateAchat?.textContent || ''
            };

            try {
                const response = await fetch(window.demandeRachat, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify(dataToSend)
                });
                const result = await response.json();
                if (response.ok) {
                    showRachatNotification(result.message, 'success');
                    setTimeout(() => {
                        fetchRacheterPcInfo(); 
                    }, 1500);
                } else {
                    showRachatNotification("Erreur lors de l'envoi de la demande : " + result.error, 'error');
                }
            } catch (error) {
                console.error("Erreur réseau :", error);
                showRachatNotification("Une erreur s'est produite lors de l'envoi.", 'error');
            } finally {
                // Désactiver l'état de chargement
                showRachatLoadingState(false, btnRachat);
            }
        });
    }

    // Gestion des clics sur les boutons Valider/Refuser dans la table des demandes de rachat
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.action-btn-demande');
        if (btn) {
            const row = btn.closest('tr');
            if (!row) return;
            
            const pcId = row.getAttribute('data-pc-id');
            if (!pcId) {
                showRachatNotification("Impossible de trouver l'ID du PC pour cette ligne.", 'error');
                return;
            }
            
            const action = btn.textContent.trim().toLowerCase(); 
            const userFonction = window.connectedUserFonction;
            
            if (!['RMG','DAF'].includes(userFonction)) {
                showRachatNotification('Votre fonction n\'est pas reconnue ou vous n\'êtes pas connecté.', 'error');
                return;
            }
            
            const url = window.validerOuRefuserPcUrl || '/Gestionnaire_pc/valider_ou_refuser_pc/';
            const payload = {
                pc_id: pcId,
                action: action,
                fonction: userFonction.toUpperCase()
            };
            
            console.log('[DEBUG] Envoi AJAX', url, payload);
            
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
            if (!csrfToken) {
                showRachatNotification('Token CSRF manquant', 'error');
                return;
            }

            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(payload)
            })
            .then(r => r.json())
            .then(data => {
                console.log('[DEBUG] Réponse AJAX', data);
                if (data.status) {
                    row.querySelectorAll('.action-btn-demande').forEach(b => b.style.display = 'none');
                    row.insertAdjacentHTML('beforeend', '<td><span>'+data.status+'</span></td>');
                    showRachatNotification('Action effectuée avec succès : ' + data.status, 'success');
                } else if (data.error) {
                    showRachatNotification('Erreur : ' + data.error, 'error');
                }
            })
            .catch(err => {
                showRachatNotification('Erreur AJAX : ' + err, 'error');
                console.error('[DEBUG] Erreur AJAX', err);
            });
            
            e.preventDefault();
        }
    });
}

/**
 * Gère l'état de chargement pour le bouton de demande de rachat
 * @param {boolean} isLoading - État de chargement
 * @param {HTMLElement} submitButton - Bouton de soumission
 */
function showRachatLoadingState(isLoading, submitButton) {
    if (!submitButton) return;
    
    if (isLoading) {
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
        submitButton.innerHTML = submitButton.dataset.originalText || 'Envoyer demande';
        submitButton.style.opacity = '1';
        
        // Retirer la classe de chargement
        submitButton.classList.remove('loading');
    }
}

/**
 * Affiche une notification pour les opérations de rachat
 * @param {string} message - Message à afficher
 * @param {string} type - Type de notification (success, error, info)
 */
function showRachatNotification(message, type = 'info') {
    // Créer ou réutiliser un conteneur de notification
    let notificationContainer = document.getElementById('rachat-notification-container');  
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'rachat-notification-container';
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
    if (!document.getElementById('rachat-notification-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'rachat-notification-styles';
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

function styleActionButtons() {
    // Styliser tous les boutons avec la classe action-btn-demande
    const actionButtons = document.querySelectorAll('.action-btn-demande');
    actionButtons.forEach(button => {
        const text = button.textContent.trim().toLowerCase();
        
        if (text.includes('valider') || text.includes('approuver')) {
            button.classList.add('btn-validate');
            button.style.cssText = `
                background-color: #28a745 !important;
                color: white !important;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.3s ease;
                min-width: 70px;
                text-align: center;
            `;
            
            // Ajouter l'effet hover
            button.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#218838 !important';
                this.style.transform = 'translateY(-1px)';
                this.style.boxShadow = '0 2px 4px rgba(40, 167, 69, 0.3)';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '#28a745 !important';
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            });
            
        } else if (text.includes('refuser') || text.includes('rejeter')) {
            button.classList.add('btn-reject');
            button.style.cssText = `
                background-color: #dc3545 !important;
                color: white !important;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.3s ease;
                min-width: 70px;
                text-align: center;
            `;
            
            // Ajouter l'effet hover
            button.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#c82333 !important';
                this.style.transform = 'translateY(-1px)';
                this.style.boxShadow = '0 2px 4px rgba(220, 53, 69, 0.3)';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '#dc3545 !important';
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            });
        }
    });
    
    // Observer pour les boutons ajoutés dynamiquement
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        const newButtons = node.querySelectorAll ? node.querySelectorAll('.action-btn-demande') : [];
                        newButtons.forEach(button => {
                            if (!button.classList.contains('btn-validate') && !button.classList.contains('btn-reject')) {
                                styleActionButtons(); // Re-styliser les nouveaux boutons
                            }
                        });
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}
window.DashboardRachatManagement = {
    initRachatManagement,
    fetchRacheterPcInfo
};
