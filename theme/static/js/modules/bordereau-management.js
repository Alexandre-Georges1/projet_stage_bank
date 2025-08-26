/**
 * ===============================
 * BORDEREAU MANAGEMENT : Gestion des bordereaux
 * ===============================
 */


// Test immédiat au chargement du module


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
                'bordereauTelephone': rowData.telephone,
                'bordereauEmail': rowData.email || 'Non renseigné'
            };

            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });

            // Stocker l'ID de l'employé et les informations sur la modale pour l'envoi
            const bordereauModal = document.getElementById('bordereauModal');
            if (bordereauModal) {
                // Nettoyer d'éventuelles lignes ajoutées précédemment et réinitialiser la numérotation
                resetBordereauExtraRows(bordereauModal);
                bordereauModal.dataset.employeId = rowData.employeId;
                bordereauModal.dataset.nomEmploye = rowData.nom;
                bordereauModal.dataset.prenomEmploye = rowData.prenom;
                bordereauModal.dataset.marquePc = rowData.marque;
                bordereauModal.dataset.modelePc = rowData.modele;
                bordereauModal.dataset.numeroSeriePc = rowData.numeroSerie;
                bordereauModal.dataset.telephoneEmploye = rowData.telephone;
                bordereauModal.dataset.emailEmploye = rowData.email;

        // Précharger les matériels déjà enregistrés sur le dernier bordereau (si existants) et statut
                try {
                    if (rowData.employeId) {
            prefillBordereauItems(rowData.employeId);
            prefillBordereauStatus(rowData.employeId);
                    }
                } catch (_) { /* noop */ }

                // Attacher l'écouteur d'événements au bouton Envoyer demande
                const btnEnvoyerDemande = bordereauModal.querySelector('.btn-Envoyer-Demande');
                if (btnEnvoyerDemande) {
                    btnEnvoyerDemande.onclick = async function() {
                        await handleEnvoyerDemande(bordereauModal);
                    };
                }

                // Bouton (+) pour ajouter une ligne matériel
                const addRowBtn = bordereauModal.querySelector('#btnAddBordereauRow');
                if (addRowBtn) {
                    // éviter doublons
                    addRowBtn.replaceWith(addRowBtn.cloneNode(true));
                    const newAddBtn = bordereauModal.querySelector('#btnAddBordereauRow');
                    if (newAddBtn) newAddBtn.addEventListener('click', handleAddBordereauRow);
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

    // Gérer l'activation/désactivation du bouton d'acceptation via la checkbox
    // Cette fonction peut être appelée quand la vue bordereau devient active
    
    
    // Initialiser l'état de la vue si les éléments sont présents
    initBordereauViewElements();
}

// Nettoyer les lignes additionnelles et restaurer la numérotation
function resetBordereauExtraRows(modalEl) {
    try {
        const tbody = modalEl.querySelector('#bordereauTable tbody');
        if (!tbody) return;
        const rows = tbody.querySelectorAll('tr:not(.bordereau-template)');
        // Conserver la première ligne (PC principal), supprimer les suivantes
        rows.forEach((tr, idx) => { if (idx >= 1) tr.remove(); });
        // Rien à faire pour la template (reste cachée)
    } catch (_) { /* noop */ }
}

// Ajouter une nouvelle ligne matériel à partir de la template
function handleAddBordereauRow() {
    const table = document.getElementById('bordereauTable');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    const template = tbody.querySelector('tr.bordereau-template');
    if (!template) return;

    const clone = template.cloneNode(true);
    clone.classList.remove('bordereau-template');
    clone.style.display = '';
    clone.removeAttribute('aria-hidden');

    // Numéro = nombre de lignes visibles (non template) + 1
    const visibleRows = tbody.querySelectorAll('tr:not(.bordereau-template)').length;
    const numCell = clone.querySelector('.num');
    if (numCell) numCell.textContent = visibleRows + 1;

    tbody.appendChild(clone);
    // Focus sur le premier champ
    const serieInput = clone.querySelector('.b-serie');
    if (serieInput) serieInput.focus();
}

// Pré-remplir les lignes de matériels depuis l'API
async function prefillBordereauItems(employeId) {
    const table = document.getElementById('bordereauTable');
    const tbody = table?.querySelector('tbody');
    const template = tbody?.querySelector('tr.bordereau-template');
    if (!tbody || !template) return;

    try {
        const resp = await fetch(`/bordereau-details/${employeId}/`, { headers: { 'Accept': 'application/json' } });
        if (!resp.ok) return; // pas de bordereau existant -> ignorer
        const data = await resp.json();
        const items = Array.isArray(data.items) ? data.items : [];
        if (!items.length) return;

        // Nettoyer d'abord d'éventuelles lignes ajoutées (on garde la 1re ligne PC)
        const rows = tbody.querySelectorAll('tr:not(.bordereau-template)');
        rows.forEach((tr, idx) => { if (idx >= 1) tr.remove(); });

        // Ajouter chaque item comme une nouvelle ligne
        items.forEach((it, index) => {
            const clone = template.cloneNode(true);
            clone.classList.remove('bordereau-template');
            clone.style.display = '';
            clone.removeAttribute('aria-hidden');

            const visibleRows = tbody.querySelectorAll('tr:not(.bordereau-template)').length;
            const numCell = clone.querySelector('.num');
            if (numCell) numCell.textContent = visibleRows + 1;

            const inpSerie = clone.querySelector('.b-serie');
            const inpDesc = clone.querySelector('.b-desc');
            const inpQty = clone.querySelector('.b-qty');
            if (inpSerie) inpSerie.value = it.numero_serie || '';
            if (inpDesc) inpDesc.value = it.description || it.materiel || '';
            if (inpQty) inpQty.value = it.quantite || 1;

            tbody.appendChild(clone);
        });
    } catch (_) {
        // silencieux
    }
}

// Pré-remplir le statut du bordereau et ses dates
async function prefillBordereauStatus(employeId) {
    const statusBlock = document.getElementById('bordereauStatusBlock');
    const badge = document.getElementById('bordereauStatutBadge');
    const dates = document.getElementById('bordereauDates');
    const luAt = document.getElementById('bordereauLuAt');
    const accepteAt = document.getElementById('bordereauAccepteAt');
    if (!statusBlock || !badge) return;

    // Réinitialiser
    badge.textContent = 'En attente';
    badge.style.background = '#fee2e2';
    badge.style.color = '#991b1b';
    if (dates) dates.style.display = 'none';
    if (luAt) { luAt.style.display = 'none'; const s = luAt.querySelector('span'); if (s) s.textContent = ''; }
    if (accepteAt) { accepteAt.style.display = 'none'; const s = accepteAt.querySelector('span'); if (s) s.textContent = ''; }

    try {
        const resp = await fetch(`/bordereau-details/${employeId}/`, { headers: { 'Accept': 'application/json' } });
        if (!resp.ok) return;
        const data = await resp.json();
        const statut = (data.statut || '').toLowerCase();
        const dateStatut = data.date_statut || null;

        if (statut.includes('accept')) {
            badge.textContent = 'Lu et accepté';
            badge.style.background = '#dcfce7';
            badge.style.color = '#065f46';
            if (dates && accepteAt) {
                dates.style.display = '';
                accepteAt.style.display = '';
                const s = accepteAt.querySelector('span');
                if (s) s.textContent = formatDateFr(dateStatut) || '';
            }
        } else if (statut.includes('lu')) {
            badge.textContent = 'Lu';
            badge.style.background = '#fef9c3';
            badge.style.color = '#92400e';
            if (dates && luAt) {
                dates.style.display = '';
                luAt.style.display = '';
                const s = luAt.querySelector('span');
                if (s) s.textContent = formatDateFr(dateStatut) || '';
            }
        } else {
            badge.textContent = 'En attente';
            badge.style.background = '#fee2e2';
            badge.style.color = '#991b1b';
        }
    } catch (_) { /* noop */ }
}

function formatDateFr(isoOrStr) {
    if (!isoOrStr) return '';
    try {
        // Accepte 'YYYY-MM-DD' ou ISO datetime
        const d = new Date(isoOrStr);
        if (isNaN(d.getTime())) return isoOrStr;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
    } catch (_) { return isoOrStr; }
}

// Fonction pour gérer l'envoi de la demande
async function handleEnvoyerDemande(bordereauModal) {
    const btnEnvoyerDemande = bordereauModal.querySelector('.btn-Envoyer-Demande');
    showBordereauLoadingState(true, btnEnvoyerDemande);
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;  
    if (!csrfToken) {
        showBordereauNotification('Token CSRF manquant', 'error');
        showBordereauLoadingState(false, btnEnvoyerDemande);
        return;
    }

    // Collecter toutes les lignes additionnelles saisies par l'utilisateur
    const items = [];
    try {
        const tbody = document.querySelector('#bordereauTable tbody');
        if (tbody) {
            const extraRows = Array.from(tbody.querySelectorAll('tr:not(.bordereau-template)')).slice(1); // ignorer la 1ère ligne (PC)
            extraRows.forEach(tr => {
                const numero = tr.querySelector('.b-serie')?.value?.trim() || '';
                const desc = tr.querySelector('.b-desc')?.value?.trim() || '';
                const qteRaw = tr.querySelector('.b-qty')?.value;
                const qte = Math.max(parseInt(qteRaw || '1', 10) || 1, 1);
                if (numero || desc) {
                    items.push({ numero_serie: numero, description: desc, quantite: qte });
                }
            });
        }
    } catch (_) { /* noop */ }

    const dataToSend = {
        employe_id: bordereauModal.dataset.employeId,
        nom_employe: bordereauModal.dataset.nomEmploye,
        prenom_employe: bordereauModal.dataset.prenomEmploye,
        marque_pc: bordereauModal.dataset.marquePc,
        modele_pc: bordereauModal.dataset.modelePc,
        numero_serie_pc: bordereauModal.dataset.numeroSeriePc,
        description_pc: bordereauModal.dataset.marquePc + ' ' + bordereauModal.dataset.modelePc,
        telephone_employe: bordereauModal.dataset.telephoneEmploye,
        email_employe: bordereauModal.dataset.emailEmploye || '',
        items
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
            // Après envoi, rafraîchir le statut
            if (bordereauModal?.dataset?.employeId) {
                prefillBordereauStatus(bordereauModal.dataset.employeId);
            }
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
    const printContents = modal.querySelector('.modern-modal-content')?.innerHTML || '';
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
    showBordereauLoadingState(true, acceptBtn);
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
            // Mettre à jour le badge de statut si la modale est ouverte
            const modal = document.getElementById('bordereauModal');
            if (modal && !modal.classList.contains('hidden')) {
                const employeId = modal.dataset?.employeId;
                if (employeId) prefillBordereauStatus(employeId);
            }
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
window.handleAcceptBordereau = handleAcceptBordereau;

// Fonction pour gérer l'activation du bouton
function toggleAcceptButton() {
    const checkbox = document.getElementById('acceptCheckbox'); 
    const button = document.getElementById('acceptBordereauBtn');
    
    if (checkbox && button) {
        const wasDisabled = button.disabled;
        button.disabled = !checkbox.checked;
        // Ajouter une classe visuelle pour le feedback
        if (checkbox.checked) {
            button.classList.remove('btn-disabled');
            button.classList.add('btn-enabled');
        } else {
            button.classList.remove('btn-enabled');
            button.classList.add('btn-disabled');
        }
    } else {
        console.error('Checkbox ou bouton non trouvé - Checkbox:', checkbox, 'Bouton:', button);
    }
}
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
// Fonction spécifique pour initialiser les éléments de la vue bordereau
function initBordereauViewElements() {
    const bordereauCheckbox = document.getElementById('acceptCheckbox');
    const acceptBordereauBtn = document.getElementById('acceptBordereauBtn');
    
    if (bordereauCheckbox && acceptBordereauBtn) {
        
        // Supprimer les anciens événements pour éviter les doublons
        bordereauCheckbox.removeEventListener('change', handleCheckboxChange);
        bordereauCheckbox.addEventListener('change', handleCheckboxChange);
        
        // Retirer l'onclick du bouton s'il existe et ajouter notre événement
        acceptBordereauBtn.removeAttribute('onclick');
        acceptBordereauBtn.removeEventListener('click', handleAcceptBordereau);
        acceptBordereauBtn.addEventListener('click', handleAcceptBordereau);
        
        // Initialiser l'état du bouton
        toggleAcceptButton();
        return true;
    } 
}

// Fonction pour gérer le changement de la checkbox
function handleCheckboxChange() {
    toggleAcceptButton();
}

// Fonction améliorée pour détecter quand la vue bordereau devient active
function observeBordereauView() { /* simplifié: non nécessaire avec init direct */ }

window.DashboardBordereauManagement = {
    initBordereauManagement,
    initBordereauViewElements, // Fonction exposée
    observeBordereauView,      // Nouvelle fonction exposée
    handleEnvoyerDemande,
    handleDownloadBordereau,
    handleAcceptBordereau,
    handleAddBordereauRow
};
