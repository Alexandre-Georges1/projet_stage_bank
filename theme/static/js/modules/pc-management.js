/**
 * ===============================
 * PC MANAGEMENT : Gestion des ordinateurs
 * ===============================
 */

// Variables globales pour la gestion des marques et modèles
const URL_MARQUES = '/gestion_marques/';
const URL_MODELES = '/gestion_modeles/';
let marques = [];
let modeles = [];

// Fonctions de notification pour le module PC
function showPcLoadingState(isLoading) {
    const submitButton = document.querySelector('#addPcForm button[type="submit"]');
    if (submitButton) {
        if (isLoading) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner"></span> Traitement...';
        } else {
            submitButton.disabled = false;
            const mode = document.getElementById('addPcForm')?.dataset.mode;
            submitButton.textContent = mode === 'edit' ? 'Enregistrer les modifications' : 'Ajouter PC';
        }
    }
}

function showPcNotification(message, type = 'success') {
    console.log('=== DEBUG NOTIFICATION ===');
    console.log('Message:', message);
    console.log('Type:', type);
    
    // Créer ou récupérer le conteneur de notifications
    let notificationContainer = document.getElementById('pc-notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'pc-notification-container';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }

    // Créer la notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
    `;

    // Ajouter la notification au conteneur
    notificationContainer.appendChild(notification);

    // Animation d'entrée
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Gestion de la fermeture
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });

    // Auto-fermeture après 5 secondes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// Fonction pour charger les modèles
function chargerModeles() {
    fetch('/gestion_modeles/')
        .then(response => response.json())
        .then(data => {
            const liste = document.getElementById('liste-modeles');
            if (liste) {
                liste.innerHTML = '';
                data.modeles.forEach(modele => {
                    const li = document.createElement('li');
                    li.textContent = modele.nom + " ";
                    
                    const btn = document.createElement('button');
                    btn.textContent = " ";
                    btn.onclick = () => supprimerModele(modele.nom);
                    
                    li.appendChild(btn);
                    liste.appendChild(li);
                });
            }
        })
        .catch(error => console.error('Erreur lors du chargement des modèles:', error));
}

// Fonction pour charger les marques
async function chargerMarques() {
    try {
        const response = await fetch(URL_MARQUES);
        const data = await response.json();
        marques = data.marques;
        afficherMarques();
    } catch (error) {
        console.error('Erreur chargement marques:', error);
    }
}

// Fonction pour charger les modèles de façon asynchrone
async function chargerModelesAsync() {
    try {
        const response = await fetch(URL_MODELES);
        const data = await response.json();
        modeles = data.modeles;
        afficherModeles();
    } catch (error) {
        console.error('Erreur chargement modèles:', error);
    }
}

// Fonction pour afficher les marques
function afficherMarques() {
    const tbody = document.getElementById('tableMarques');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    marques.forEach((marque, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${marque.nom_marque}</td>
            <td>
                <button onclick="supprimerMarque('${marque.nom_marque}')">🗑</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Fonction pour afficher les modèles
function afficherModeles() {
    const tbody = document.getElementById('tableModeles');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    modeles.forEach((modele, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${modele.nom_modele}</td>
            <td>
                <button onclick="supprimerModele('${modele.nom_modele}')">🗑</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Fonction pour ajouter une marque
async function ajouterMarque() {
    const input = document.getElementById('inputMarque');
    if (!input) return;
    
    const nom = input.value.trim();
    if (!nom) return;

    const getCookie = window.DashboardUtils?.getCookie || function(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    };

    try {
        const response = await fetch(URL_MARQUES, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ nom })
        });

        if (response.ok) {
            input.value = '';
            await chargerMarques();
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout de la marque:', error);
    }
}

// Fonction pour ajouter un modèle
async function ajouterModele() {
    const input = document.getElementById('inputModele');
    if (!input) return;
    
    const nom = input.value.trim();
    if (!nom) return;

    const getCookie = window.DashboardUtils?.getCookie || function(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    };
    

    try {
        const response = await fetch(URL_MODELES, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                 'X-CSRFToken': getCookie('csrftoken') },
            body: JSON.stringify({ nom })
        });

        if (response.ok) {
            input.value = '';
            await chargerModelesAsync();
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout du modèle:', error);
    }
}

// Fonction pour supprimer une marque
async function supprimerMarque(nom) {
    try {
        const response = await fetch(URL_MARQUES, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                 'X-CSRFToken': getCookie('csrftoken') },
            body: JSON.stringify({ nom })
        });

        if (response.ok) {
            await chargerMarques();
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de la marque:', error);
    }
}

// Fonction pour supprimer un modèle
async function supprimerModele(nom) {
    try {
        const response = await fetch(URL_MODELES, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                 'X-CSRFToken': getCookie('csrftoken') },
            body: JSON.stringify({ nom })
        });

        if (response.ok) {
            await chargerModelesAsync();
        }
    } catch (error) {
        console.error('Erreur lors de la suppression du modèle:', error);
    }
}

// Fonction principale d'initialisation de la gestion des PCs
function initPcManagement() {
    // Charger marques et modèles au démarrage
    chargerMarques();
    chargerModelesAsync();

    // Gérer l'ouverture du modal (Ajouter/Modifier PC)
    const addPcBtn = document.getElementById('new-user-btn');
    const addPcModal = document.getElementById('addPcModal');
    const modalTitle = addPcModal ? addPcModal.querySelector('h2') : null;
    const modalCloseButton = document.querySelector('#addPcModal .modal-close-button');
    const addPcForm = document.getElementById('addPcForm');
    const formMarque = document.getElementById('brand'); // Corrigé: était 'marque'
    const formModel = document.getElementById('model');
    const formProcesseur = document.getElementById('processeur');
    const formRam = document.getElementById('ram');
    const formDisque = document.getElementById('disque');
    const formSerial = document.getElementById('serial');
    const formDateAchat = document.getElementById('dateAchat');
    const formSubmitBtn = addPcForm ? addPcForm.querySelector('button[type="submit"]') : null;

  

    // Variables pour la modale des PCs Attribués (Historique)
    const attributedPcBtn = document.getElementById('attributed-pcs-btn');
    const attributedPcModal = document.getElementById('attributedPcModal');
    const closeAttributedPcModalBtn = attributedPcModal ? attributedPcModal.querySelector('.modal-close-button') : null;

    // Gérer le clic sur le bouton Caractéristiques Reçues
    const receivedCharacteristicsBtn = document.getElementById('received-characteristics-btn');
    if (receivedCharacteristicsBtn) {
        receivedCharacteristicsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.DashboardCore?.switchView) {
                window.DashboardCore.switchView('received-characteristics-view');
            }
        });
    }

    // Fonction pour réinitialiser le formulaire et le titre du modal (Ajouter/Modifier PC)
    function resetModalForAdd() {
        if (modalTitle) modalTitle.textContent = 'Ajouter un Nouveau PC';
        if (addPcForm) addPcForm.reset();
        if (formSubmitBtn) formSubmitBtn.textContent = 'Ajouter PC';
        if (addPcForm) addPcForm.dataset.mode = 'add';
        if (formDateAchat) formDateAchat.value = '';
        if (formSerial) formSerial.value = '';
    }

    // Événements pour la modale d'ajout PC
    if (addPcBtn) {
        addPcBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resetModalForAdd();
            if (addPcModal) addPcModal.classList.remove('hidden');
        });
    }

    if (modalCloseButton && addPcModal) {
        modalCloseButton.addEventListener('click', function() {
            addPcModal.classList.add('hidden');
        });
    }

    if (addPcModal) {
        addPcModal.addEventListener('click', function(event) {
            if (event.target === addPcModal) {
                addPcModal.classList.add('hidden');
            }
        });
    }

    // Modale historique des PCs attribués
    if (attributedPcBtn) {
        attributedPcBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (attributedPcModal) {
                attributedPcModal.classList.remove('hidden');
            }
        });
    }

    if (closeAttributedPcModalBtn) {
        closeAttributedPcModalBtn.addEventListener('click', function() {
            if (attributedPcModal) {
                attributedPcModal.classList.add('hidden');
            }
        });
    }

    if (attributedPcModal) {
        attributedPcModal.addEventListener('click', function(event) {
            if (event.target === attributedPcModal) {
                attributedPcModal.classList.add('hidden');
            }
        });
    }

    // Soumission du formulaire d'ajout/modification PC
    if (addPcForm) {
        addPcForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Activer l'état de chargement
            showPcLoadingState(true);
            
            const mode = addPcForm.dataset.mode;
            const pcId = addPcForm.dataset.pcId; 
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;

           
            // Validation côté client
            const marqueValue = formMarque?.value?.trim() || '';
            const modelValue = formModel?.value?.trim() || '';
            const processeurValue = formProcesseur?.value?.trim() || '';
            const ramValue = formRam?.value?.trim() || '';
            const disqueValue = formDisque?.value?.trim() || '';
            const serialValue = formSerial?.value?.trim() || '';
            const dateAchatValue = formDateAchat?.value || '';

         

            // Vérifier les champs obligatoires
            if (!marqueValue) {
                console.error('Marque manquante! Element:', formMarque, 'Valeur:', marqueValue);
                showPcNotification('La marque est obligatoire', 'error');
                showPcLoadingState(false);
                if (formMarque) formMarque.focus();
                return;
            }

            if (!modelValue) {
                console.error('Modèle manquant! Element:', formModel, 'Valeur:', modelValue);
                showPcNotification('Le modèle est obligatoire', 'error');
                showPcLoadingState(false);
                if (formModel) formModel.focus();
                return;
            }

            if (!serialValue) {
                console.error('Serial manquant! Element:', formSerial, 'Valeur:', serialValue);
                showPcNotification('Le numéro de série est obligatoire', 'error');
                showPcLoadingState(false);
                if (formSerial) formSerial.focus();
                return;
            }
        
            const pcData = {
                marque: marqueValue,
                model: modelValue,
                processeur: processeurValue,
                ram: ramValue,
                disque: disqueValue,
                serial: serialValue,
                dateAchat: dateAchatValue
            };

            let url = '';
            if (mode === 'add') {
                url = window.ajouterPcUrl;
            } else if (mode === 'edit') {
                url = window.modifierPcUrl?.replace('0', pcId);
            }

            if (!url) {
                showPcNotification('URL manquante pour la soumission du formulaire', 'error');
                showPcLoadingState(false);
                return;
            }

            if (!csrfToken) {
                showPcNotification('Token CSRF manquant', 'error');
                showPcLoadingState(false);
                return;
            }

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify(pcData)
                });

                const result = await response.json();
                console.log('Réponse du serveur:', result);

                if (response.ok) {
                    showPcNotification(result.message, 'success');
                    setTimeout(() => {
                        addPcModal.classList.add('hidden');
                        location.reload();
                    }, 1500);
                } else {
                    showPcNotification('Erreur : ' + (result.error || 'Erreur inconnue'), 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la soumission du formulaire PC:', error);
                showPcNotification('Une erreur est survenue lors de l\'envoi des données.', 'error');
            } finally {
                showPcLoadingState(false);
            }
        });
    }

    // Gérer les clics sur les boutons Modifier et Supprimer dans le tableau PC
    const catalogueTable = document.querySelector('#catalogue-view table tbody');
    if (catalogueTable) {
        catalogueTable.addEventListener('click', async function(e) {
            if (e.target.closest('.btn-modifier')) {
                const row = e.target.closest('tr');
                if (row) {
                    const pcId = row.dataset.pcId;
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 7) {
                        const marque = cells[0].textContent;
                        const model = cells[1].textContent;
                        const processeur = cells[2].textContent;
                        const ram = cells[3].textContent;
                        const disque = cells[4].textContent;
                        const serial = cells[5].textContent;
                        const dateAchat = cells[6].textContent;

                        if (modalTitle) modalTitle.textContent = 'Modifier un PC';
                        if (formMarque) formMarque.value = marque;
                        if (formModel) formModel.value = model;
                        if (formProcesseur) formProcesseur.value = processeur;
                        if (formRam) formRam.value = ram;
                        if (formDisque) formDisque.value = disque;
                        if (formSerial) formSerial.value = serial;
                        if (formDateAchat) formDateAchat.value = dateAchat;
                        if (formSubmitBtn) formSubmitBtn.textContent = 'Enregistrer les modifications';
                        if (addPcForm) {
                            addPcForm.dataset.mode = 'edit';
                            addPcForm.dataset.pcId = pcId;
                        }
                        if (addPcModal) addPcModal.classList.remove('hidden');
                    }
                }
            } else if (e.target.closest('.btn-supprimer')) {
                const row = e.target.closest('tr');
                if (row) {
                    const pcId = row.dataset.pcId;
                    const marque = row.cells[0]?.textContent || '';
                    const model = row.cells[1]?.textContent || '';
                    const serial = row.cells[5]?.textContent || '';
                    
                    if (confirm('Voulez-vous vraiment supprimer le PC : ' + marque + ' ' + model + ' (N° de série: ' + serial + ') ?')) {
                        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
                        const url = window.supprimerPcUrl?.replace('0', pcId);

                        if (!csrfToken || !url) {
                            showPcNotification('Données manquantes pour la suppression', 'error');
                            return;
                        }

                        try {
                            const response = await fetch(url, {
                                method: 'POST', 
                                headers: {
                                    'X-CSRFToken': csrfToken
                                }
                            });
                            const result = await response.json();
                            if (response.ok) {
                                showPcNotification(result.message, 'success');
                                row.remove();
                            } else {
                                showPcNotification('Erreur lors de la suppression : ' + result.error, 'error');
                            }
                        } catch (error) {
                            showPcNotification('Une erreur est survenue lors de la suppression.', 'error');
                        }
                    }
                }
            }
        });
    }
}

window.DashboardPcManagement = {
    initPcManagement,
    chargerModeles,
    chargerMarques,
    chargerModelesAsync,
    ajouterMarque,
    ajouterModele,
    supprimerMarque,
    supprimerModele
};
