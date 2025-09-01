/**
 * ===============================
 * RACHAT MANAGEMENT : Gestion des rachats de PC
 * ===============================
 */

// Helpers date: parsing tolérant, addition d'années (gère 29/02) et format FR
function parseDateSafe(s) {
    if (!s) return null;
    // Si déjà un objet Date
    if (s instanceof Date) return isNaN(s.getTime()) ? null : s;
    const str = String(s).trim();
    // Essayer ISO (YYYY-MM-DD) / RFC
    let d = new Date(str);
    if (!isNaN(d.getTime())) return d;
    // Essayer format dd/mm/yyyy
    const m = str.match(/^([0-3]?\d)[/.-]([0-1]?\d)[/.-](\d{4})$/);
    if (m) {
        const dd = parseInt(m[1], 10);
        const mm = parseInt(m[2], 10) - 1;
        const yy = parseInt(m[3], 10);
        d = new Date(yy, mm, dd);
        if (!isNaN(d.getTime())) return d;
    }
    return null;
}

function addYearsSafe(date, years) {
    if (!(date instanceof Date)) return null;
    const d = new Date(date.getTime());
    const month = d.getMonth();
    d.setFullYear(d.getFullYear() + years);
    // Correction 29/02 -> 28/02 si nécessaire
    if (d.getMonth() !== month) {
        d.setMonth(1, 28); // février 28
    }
    return d;
}

function formatDateFR(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = date.getFullYear();
    return `${dd}/${mm}/${yy}`;
}

// Fonction pour récupérer les informations du PC de rachat
async function fetchRacheterPcInfo() {
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

            const btn = document.querySelector('.btn-Envoyer-Demande_de_rachat');
            const dateAttr = parseDateSafe(result.pc_info.date_attribution);
            if (dateAttr && btn) {
                const elig = addYearsSafe(dateAttr, 4);
                const today = new Date();
                // Title sur le bouton
                btn.title = `Éligible au rachat à partir du ${formatDateFR(elig)}`;

                // Message à côté du bouton
                let infoEl = document.getElementById('rachatEligibilityInfo');
                if (!infoEl) {
                    infoEl = document.createElement('div');
                    infoEl.id = 'rachatEligibilityInfo';
                    infoEl.style.cssText = 'margin-top:8px;font-size:12px;';
                    btn.insertAdjacentElement('afterend', infoEl);
                }
                if (today < elig) {
                    infoEl.textContent = `Éligible le ${formatDateFR(elig)}`;
                    infoEl.style.color = '#b7791f'; // amber
                } else {
                    infoEl.textContent = 'Éligible au rachat';
                    infoEl.style.color = '#2f855a'; // green
                }
            }
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

            // Garde front: empêcher l'envoi si amortissement non atteint
            const dateAttrText = document.getElementById('racheterDateAttribution')?.textContent;
            const dateAttr = parseDateSafe(dateAttrText);
            if (dateAttr) {
                const elig = addYearsSafe(dateAttr, 4);
                if (elig && new Date() < elig) {
                    showRachatNotification("la date d'amortissement de votre ordinateur n'est pas encore atteinte", 'error', 'Rachat');
                    return;
                }
            }
            
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
                    showRachatNotification(result?.error || "Erreur lors de l'envoi de la demande.", 'error');
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
function showRachatNotification(message, type = 'info', title = null) {
    // Utiliser le système global si disponible
    if (window.showNotification && typeof window.showNotification === 'function') {
        return window.showNotification(message, type, title);
    }
    if (window.NotificationSystem && typeof window.NotificationSystem.show === 'function') {
        return window.NotificationSystem.show(message, type, title ? { title } : {});
    }
    // Fallback minimal
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    alert(`${icon} ${title ? title + ': ' : ''}${message}`);
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
