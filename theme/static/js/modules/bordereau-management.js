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
                        prefillBordereauData(rowData.employeId); // fetch unique + rendu optimisé
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

// Nouvelle fonction: un seul fetch pour items + statut, moins de latence
async function prefillBordereauData(employeId) {
    const statusBlock = document.getElementById('bordereauStatusBlock');
    const badge = document.getElementById('bordereauStatutBadge');
    const dates = document.getElementById('bordereauDates');
    const luAt = document.getElementById('bordereauLuAt');
    const accepteAt = document.getElementById('bordereauAccepteAt');
    const table = document.getElementById('bordereauTable');
    const tbody = table?.querySelector('tbody');
    const template = tbody?.querySelector('tr.bordereau-template');

    try {
        const resp = await fetch(`/bordereau-details/${employeId}/`, { headers: { 'Accept': 'application/json' } });
        if (!resp.ok) return;
        const data = await resp.json();

        // 1) Statut
        if (statusBlock && badge) {
            const statut = (data.statut || '').toLowerCase();
            const dateStatut = data.date_statut || null;
            // Reset
            if (dates) dates.style.display = 'none';
            if (luAt) { luAt.style.display = 'none'; const s = luAt.querySelector('span'); if (s) s.textContent = ''; }
            if (accepteAt) { accepteAt.style.display = 'none'; const s = accepteAt.querySelector('span'); if (s) s.textContent = ''; }
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
        }

        // 2) Items
        if (!tbody || !template) return;
        const items = Array.isArray(data.items) ? data.items : [];
        if (!items.length) return;

        // Nettoyer les lignes ajoutées précédemment (on garde la 1re ligne PC)
        const rows = tbody.querySelectorAll('tr:not(.bordereau-template)');
        rows.forEach((tr, idx) => { if (idx >= 1) tr.remove(); });

        // Rendu optimisé avec DocumentFragment
        const frag = document.createDocumentFragment();
        let count = tbody.querySelectorAll('tr:not(.bordereau-template)').length; // devrait être 1
        for (const it of items) {
            const clone = template.cloneNode(true);
            clone.classList.remove('bordereau-template');
            clone.style.display = '';
            clone.removeAttribute('aria-hidden');
            const numCell = clone.querySelector('.num');
            if (numCell) numCell.textContent = (++count);
            const inpSerie = clone.querySelector('.b-serie');
            const inpDesc = clone.querySelector('.b-desc');
            const inpQty = clone.querySelector('.b-qty');
            if (inpSerie) inpSerie.value = it.numero_serie || '';
            if (inpDesc) inpDesc.value = it.description || it.materiel || '';
            if (inpQty) inpQty.value = it.quantite || 1;
            frag.appendChild(clone);
        }
        tbody.appendChild(frag);
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
    const loadingStart = Date.now();
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;  
    if (!csrfToken) {
        showBordereauNotification('Token CSRF manquant', 'error');
        // Assurer 3s de loading affiché minimum
        const elapsed = Date.now() - loadingStart; const wait = Math.max(0, 3000 - elapsed);
        setTimeout(() => showBordereauLoadingState(false, btnEnvoyerDemande), wait);
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
            // Laisser le temps de lecture (~3s) avant de fermer la modale
            setTimeout(() => {
                bordereauModal.classList.add('hidden');
            }, 3000);
        } else {
            showBordereauNotification("Erreur lors de l'envoi du bordereau : " + result.error, 'error');
        }
    } catch (error) {
        showBordereauNotification("Une erreur est survenue lors de l'envoi du bordereau.", 'error');
    } finally {
        // Désactiver l'état de chargement après un minimum de 3s
        const elapsed = Date.now() - loadingStart; const wait = Math.max(0, 3000 - elapsed);
        setTimeout(() => showBordereauLoadingState(false, btnEnvoyerDemande), wait);
    }
}

// Fonction pour gérer le téléchargement/impression du bordereau
function handleDownloadBordereau() {
    const modal = document.getElementById('bordereauModal');
    const printBtn = document.getElementById('downloadBordereauBtn');

    if (!modal || !printBtn) return;

    const contentNode = modal.querySelector('.modern-modal-content');
    if (!contentNode) return;

    // Cloner le contenu et convertir les champs éditables en texte pour l'impression
    const clone = contentNode.cloneNode(true);
    // Retirer les templates cachées
    clone.querySelectorAll('.bordereau-template').forEach(n => n.remove());
    // Remplacer inputs/select/textarea par leur valeur lisible
    clone.querySelectorAll('input, textarea, select').forEach(el => {
        const span = document.createElement('span');
        span.style.whiteSpace = 'pre-wrap';
        if (el.tagName === 'SELECT') {
            const opt = el.selectedOptions && el.selectedOptions[0];
            span.textContent = (opt && (opt.textContent || opt.value)) || '';
        } else if (el.tagName === 'TEXTAREA') {
            span.textContent = el.value || '';
        } else {
            const type = (el.getAttribute('type') || 'text').toLowerCase();
            if (type === 'checkbox' || type === 'radio') {
                span.textContent = el.checked ? '✓' : '✗';
            } else {
                span.textContent = el.value || '';
            }
        }
        // Conserver un style de cellule si utile
        span.className = el.className;
        el.replaceWith(span);
    });

    // Supprimer la croix de fermeture dans la version imprimée
    clone.querySelectorAll('.modal-close-button, .modern-close-btn, .modern-header-close').forEach(n => n.remove());

    const printContents = clone.innerHTML;
    const win = window.open('', '', 'height=600,width=800');
    
    if (win) {
        win.document.write('<html><head><title>Bordereau de Livraison</title>');
    win.document.write('<style>@media print {.no-print{display:none!important;}} table{width:100%;border-collapse:collapse;} td,th{border:1px solid #ddd;padding:6px;} .num{width:40px;text-align:center;} .modal-close-button,.modern-close-btn,.modern-header-close{display:none!important;}</style>');
        win.document.write('</head><body>');
        win.document.write(printContents);
        win.document.write('</body></html>');
        win.document.close();
        win.focus();    
        setTimeout(() => {
            win.print();
            win.close();
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
    const loadingStart = Date.now();
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
            const elapsed = Date.now() - loadingStart; const wait = Math.max(0, 3000 - elapsed);
            setTimeout(() => showBordereauLoadingState(false, acceptBtn), wait);
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
    // Utiliser exclusivement le système global si présent (aligné PC Management)
    const ns = window.NotificationSystem;
    const opts = { title: 'Bordereau', duration: 3500 };
    if (ns) {
        if (typeof ns[type] === 'function') return ns[type](message, opts);
        if (typeof ns.show === 'function') return ns.show(message, type);
    }
    // Fallback minimal
    if (type === 'error') alert('Erreur: ' + message);
    else alert(message);
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
    initBordereauViewElements,
    observeBordereauView,
    handleEnvoyerDemande,
    handleDownloadBordereau,
    handleAcceptBordereau,
    handleAddBordereauRow
};
