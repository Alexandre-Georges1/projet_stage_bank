/**
 * ===============================
 * USER MANAGEMENT : Gestion des utilisateurs
 * ===============================
 */

// Fonction de notification unifiée (même système que pc-management.js)
function showUserNotification(message, type = 'info', title = null) {
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

// Fonction principale d'initialisation de la gestion des utilisateurs
function initUserManagement() {
    // Attribution de PC
    initPcAssignment();
    
    // Gestion des utilisateurs (ajout/modification/suppression)
    initUserCrud();
    
    // Gestion des employés
    initEmployeeManagement();
    
    // Gestion des caractéristiques
    initCharacteristics();
}

// Initialisation de l'attribution de PC
function initPcAssignment() {
    // Garde globale pour éviter les attachements multiples si le script est chargé deux fois
    if (window.__assignPcHandlersBound) return;
    window.__assignPcHandlersBound = true;

    const assignPcBtn = document.getElementById('assign-pc-btn');
    const assignPcModal = document.getElementById('assignPcModal');
    const assignModalCloseButton = document.querySelector('#assignPcModal .modal-close-button');
    const assignPcForm = document.getElementById('assignPcForm');
    const assignPcform = document.getElementById('assignPcform');

    if (assignPcBtn) {
        assignPcBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (assignPcForm) assignPcForm.reset();
            if (assignPcModal) assignPcModal.classList.remove('hidden');
        });
    }

    if (assignModalCloseButton && assignPcModal) {
        assignModalCloseButton.addEventListener('click', function() {
            assignPcModal.classList.add('hidden');
        });
    }

    if (assignPcModal) {
        assignPcModal.addEventListener('click', function(event) {
            if (event.target === assignPcModal) {
                assignPcModal.classList.add('hidden');
            }
        });
    }

    // Soumission du formulaire d'attribution de PC
    if (assignPcform) {
        assignPcform.addEventListener('submit', async function(e) {
            e.preventDefault();
            // Verrou anti double-soumission
            if (assignPcform.dataset.submitting === '1') return;
            assignPcform.dataset.submitting = '1';
            const employeSelect = document.getElementById('assignEmploye');
            const pcNumeroSerieSelect = document.getElementById('assignPcNumeroSerie');
            const dateAttribution = document.getElementById('assignDateAttribution')?.value;
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
            
            if (!employeSelect || !pcNumeroSerieSelect || !csrfToken) {
                showUserNotification("Éléments manquants dans le formulaire.", 'error', 'Erreur Formulaire');
                return;
            }

            const employeId = employeSelect.value;
            const numeroSerie = pcNumeroSerieSelect.value;
            
            if (!employeId || !numeroSerie || !dateAttribution) {
                showUserNotification("Veuillez remplir tous les champs obligatoires.", 'warning', 'Champs Manquants');
                return;
            }

            const data = {
                employe_id: employeId,
                numero_serie: numeroSerie,
                date_attribution: dateAttribution
            };

            try {
                const response = await fetch(window.assignPcUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrfToken
                    },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (response.ok) {
                    showUserNotification(result.message || "PC attribué avec succès !", 'success', 'Attribution Réussie');
                    const modal = document.getElementById('assignPcModal');
                    if (modal) modal.classList.add('hidden');
                    location.reload();
                } else {
                    showUserNotification(result.error || "Erreur lors de l'attribution du PC.", 'error', 'Échec Attribution');
                }
            } catch (error) {
                console.error(error);
                showUserNotification("Une erreur est survenue lors de l'attribution.", 'error', 'Erreur Réseau');
            } finally {
                // Relâcher le verrou de soumission
                assignPcform.dataset.submitting = '0';
            }
        });
    }
}

// Initialisation du CRUD des utilisateurs
function initUserCrud() {
    const addUserBtn = document.getElementById('add-user-btn');
    const addUserModal = document.getElementById('addUserModal');
    const addUserModalCloseButton = document.querySelector('#addUserModal .modal-close-button');
    const addUserForm = document.getElementById('addUserForm');
    const addUserModalTitle = addUserModal ? addUserModal.querySelector('h2') : null;

    // Champs du formulaire d'ajout/modification utilisateur
    const addUserName = document.getElementById('addUserName');
    const addUserPrenom = document.getElementById('addUserPrenom');
    const addUserLogin = document.getElementById('addUserLogin');
    const addUserPassword = document.getElementById('addUserPassword');
    const addUserMatricule = document.getElementById('addUserMatricule');
    const addUserTelephone = document.getElementById('addUserTelephone');
    const addUserDepartement = document.getElementById('addUserDepartement');
    const addUserDateEmbauche = document.getElementById('addUserDateEmbauche');
    const addUserFonction = document.getElementById('addUserFonction');
    const addUserEmail = document.getElementById('addUserEmail');
    const addUserSubmitBtn = addUserForm ? addUserForm.querySelector('button[type="submit"]') : null;

    // Fonction pour réinitialiser le formulaire
    function resetModalForAddUser() {
        if (addUserModalTitle) addUserModalTitle.textContent = 'Ajouter un Nouvel Utilisateur';
        if (addUserForm) addUserForm.reset();
        if (addUserSubmitBtn) addUserSubmitBtn.textContent = 'Ajouter Utilisateur';
        if (addUserForm) addUserForm.dataset.mode = 'add';
    }

    if (addUserBtn) {
        addUserBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resetModalForAddUser();
            if (addUserModal) addUserModal.classList.remove('hidden');
        });
    }

    if (addUserModalCloseButton && addUserModal) {
        addUserModalCloseButton.addEventListener('click', function() {
            addUserModal.classList.add('hidden');
        });
    }

    if (addUserModal) {
        addUserModal.addEventListener('click', function(event) {
            if (event.target === addUserModal) {
                addUserModal.classList.add('hidden');
            }
        });
    }

    // Soumission du formulaire utilisateur
    if (addUserForm) {
        addUserForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const mode = addUserForm.dataset.mode;
            const userId = addUserForm.dataset.userId;
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;

            if (!csrfToken) {
                showUserNotification('Token CSRF manquant', 'error', 'Erreur Sécurité');
                return;
            }

            const userData = {
                nom: addUserName?.value || '',
                prenom: addUserPrenom?.value || '',
                login: addUserLogin?.value || '',
            
                matricule: addUserMatricule?.value || '',
                telephone: addUserTelephone?.value || '',
                departement: addUserDepartement?.value || '',
                dateEmbauche: addUserDateEmbauche?.value || '',
                fonction: addUserFonction?.value || '',
                email : addUserEmail?.value || ''
            };
            
            if (addUserPassword?.value) {
                userData.password = addUserPassword.value;
            }

            let url = '';
            if (mode === 'add') {
                url = window.addUserUrl;
            } else if (mode === 'edit') {
                url = window.modifierUtilisateurUrl?.replace('0', userId);
            }

            if (!url) {
                showUserNotification('URL manquante pour la soumission du formulaire', 'error', 'Erreur Configuration');
                return;
            }

            // Afficher l'indicateur de chargement
            showUserLoadingState(true, addUserSubmitBtn);

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify(userData)
                });

                const result = await response.json();

                if (response.ok) {
                    showUserNotification(result.message, 'success');
                    addUserModal.classList.add('hidden');
                    
                    // Délai avant rechargement pour que l'utilisateur voie le message
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                } else {
                    showUserNotification('Erreur : ' + result.error, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la soumission du formulaire utilisateur:', error);
                showUserNotification('Une erreur est survenue lors de l\'envoi des données.', 'error');
            } finally {
                // Masquer l'indicateur de chargement
                showUserLoadingState(false, addUserSubmitBtn);
            }
        });
    }

    // Gestion des boutons Modifier et Supprimer dans le tableau Utilisateurs
    const userTable = document.querySelector('#utilisateur-view table tbody');
    if (userTable) {
        // Helper conversion date (d/m/Y => YYYY-MM-DD)
        const toISODate = (raw) => {
            if (!raw) return '';
            const t = raw.trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t; // déjà ISO
            const m = t.match(/^(\d{2})[\/](\d{2})[\/](\d{4})$/); // d/m/Y
            if (m) return `${m[3]}-${m[2]}-${m[1]}`;
            return '';
        };

        userTable.addEventListener('click', async (e) => {
            const editBtn = e.target.closest('.btn-modifier');
            const deleteBtn = e.target.closest('.btn-supprimer');

            if (editBtn) {
                const row = editBtn.closest('tr');
                if (!row) return;
                const userId = row.dataset.userId;
                const cells = row.querySelectorAll('td');

                // Indices basés sur l'ordre actuel affiché (password masqué en col 3) :
                // 0 Nom,1 Prénom,2 Login,3 ******,4 Matricule,5 Téléphone,6 Email,7 Département,8 Date,9 Fonction
                if (cells.length < 10) {
                    console.warn('Nombre de colonnes inattendu pour la ligne utilisateur', cells.length);
                }

                const nom = cells[0]?.textContent.trim() || '';
                const prenom = cells[1]?.textContent.trim() || '';
                const login = cells[2]?.textContent.trim() || '';
                const matricule = cells[4]?.textContent.trim() || '';
                const telephone = cells[5]?.textContent.trim() || '';
                const email = cells[6]?.textContent.trim() || '';
                const departement = cells[7]?.textContent.trim() || '';
                const rawDate = cells[8]?.textContent.trim() || '';
                const fonction = cells[9]?.textContent.trim() || '';
                const dateISO = toISODate(rawDate);

                if (addUserModalTitle) addUserModalTitle.textContent = 'Modifier un Utilisateur';
                if (addUserName) addUserName.value = nom;
                if (addUserPrenom) addUserPrenom.value = prenom;
                if (addUserLogin) addUserLogin.value = login;
                if (addUserMatricule) addUserMatricule.value = matricule;
                if (addUserTelephone) addUserTelephone.value = telephone;
                if (addUserEmail) { addUserEmail.disabled = false; addUserEmail.value = email; }
                if (addUserDepartement) addUserDepartement.value = departement;
                if (addUserDateEmbauche) addUserDateEmbauche.value = dateISO; // format accepté par input date
                if (addUserFonction) addUserFonction.value = fonction;
                if (addUserSubmitBtn) addUserSubmitBtn.textContent = 'Enregistrer les modifications';

                if (addUserForm) {
                    addUserForm.dataset.mode = 'edit';
                    addUserForm.dataset.userId = userId;
                }
                if (addUserModal) addUserModal.classList.remove('hidden');
                return;
            }

            if (deleteBtn) {
                const row = deleteBtn.closest('tr');
                if (!row) return;
                const userId = row.dataset.userId;
                const nom = row.cells[0]?.textContent || '';
                const prenom = row.cells[1]?.textContent || '';

                const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
                const url = window.supprimerUtilisateurUrl?.replace('0', userId);
                if (!csrfToken || !url) return;

                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'X-CSRFToken': csrfToken }
                    });
                    const result = await response.json();
                    if (response.ok) {
                        showUserNotification(result.message, 'success', 'Utilisateur Supprimé');
                        row.remove();
                    } else {
                        showUserNotification('Erreur lors de la suppression : ' + result.error, 'error', 'Échec Suppression');
                    }
                } catch (err) {
                    console.error('Erreur suppression utilisateur:', err);
                }
            }
        });
    }
}

// Initialisation de la gestion des employés
function initEmployeeManagement() {
    const nouvelEmployeForm = document.getElementById('nouvelEmployeForm');
    const submitButton = nouvelEmployeForm ? nouvelEmployeForm.querySelector('button[type="submit"]') : null;
    
    if (nouvelEmployeForm) {
        nouvelEmployeForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
            if (!csrfToken) {
                showUserNotification('Token CSRF manquant', 'error', 'Erreur Sécurité');
                return;
            }

            const employeData = {
                nom: document.getElementById('nouvelNom')?.value || '',
                prenom: document.getElementById('nouvelPrenom')?.value || '',
                matricule: document.getElementById('nouvelMatricule')?.value || '',
                telephone: document.getElementById('nouvelTelephone')?.value || '',
                departement: document.getElementById('nouvelDepartement')?.value || '',
                dateEmbauche: document.getElementById('nouvelDateEmbauche')?.value || '',
                fonction: document.getElementById('nouvelFonction')?.value || ''
            };

            // Afficher l'indicateur de chargement
            showEmployeeLoadingState(true, submitButton);

            try {
                const response = await fetch(window.enregistrerEmployeUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify(employeData)
                });

                const text = await response.text();
                let result;
                try {
                    result = JSON.parse(text);
                } catch (jsonError) {
                    showUserNotification('Erreur inattendue (réponse non JSON) : ' + text, 'error', 'Erreur Format');
                    return;
                }

                if (response.ok) {
                    showUserNotification(result.message, 'success', 'Employé Ajouté');
                    nouvelEmployeForm.reset(); 
                    
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                } else {
                    showUserNotification('Erreur : ' + (result.error || text), 'error', 'Échec Ajout Employé');
                }

            } catch (error) {
                console.error('Erreur lors de l\'envoi des données employé:', error);
                showUserNotification('Une erreur est survenue lors de l\'envoi des données.', 'error');
            } finally {
                // Masquer l'indicateur de chargement
                showEmployeeLoadingState(false, submitButton);
            }
        });
    }
}

/**
 * Gère l'état de chargement pour le formulaire employé
 * @param {boolean} isLoading - État de chargement
 * @param {HTMLElement} submitButton - Bouton de soumission
 */
function showEmployeeLoadingState(isLoading, submitButton) {
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
        submitButton.innerHTML = submitButton.dataset.originalText || 'Informer l\'arrivée';
        submitButton.style.opacity = '1';
        
        // Retirer la classe de chargement
        submitButton.classList.remove('loading');
    }
}

/**
 * Affiche une notification pour les opérations employé
 * @param {string} message - Message à afficher
 * @param {string} type - Type de notification (success, error, info)
 */

// Initialisation de la gestion des caractéristiques
function initCharacteristics() {
    const demandeCaracteristiqueForm = document.getElementById('demandeCaracteristiqueForm');
    if (demandeCaracteristiqueForm) {
        demandeCaracteristiqueForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const submitButton = e.target.querySelector('button[type="submit"]');
            
            // Activer l'état de chargement
            showCharacteristicsLoadingState(true, submitButton);

            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
            if (!csrfToken) {
                showCharacteristicsNotification('Token CSRF manquant', 'error');
                showCharacteristicsLoadingState(false, submitButton);
                return;
            }

            const employeId = document.getElementById('demandeEmploye')?.value;
            let caracteristique = "Demande de caractéristique";
            
            const demandeData = {
                employe_id: employeId,
                caracteristique: caracteristique
            };

            try {
                const response = await fetch(window.demandeCaracteristiqueUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify(demandeData)
                });

                const result = await response.json();

                if (response.ok) {
                    showUserNotification(result.message, 'success', 'Caractéristiques');
                    demandeCaracteristiqueForm.reset(); 
                } else {
                    showUserNotification('Erreur : ' + result.error, 'error', 'Caractéristiques');
                }
            } catch (error) {
                console.error('Erreur lors de l\'envoi de la demande de caractéristique:', error);
                showUserNotification('Une erreur est survenue lors de l\'envoi des données.', 'error', 'Caractéristiques');
            } finally {
                // Désactiver l'état de chargement
                showCharacteristicsLoadingState(false, submitButton);
            }
        });
    }

    // Envoi de caractéristiques
    const sendCharacteristicsBtn = document.getElementById('send-characteristics-btn');
    const sendCharacteristicsModal = document.getElementById('sendCharacteristicsModal');
    const sendCharacteristicsModalCloseButton = sendCharacteristicsModal ? sendCharacteristicsModal.querySelector('.modal-close-button') : null;
    const sendCharacteristicsForm = document.getElementById('sendCharacteristicsForm');

    if (sendCharacteristicsBtn) {
        sendCharacteristicsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (sendCharacteristicsForm) sendCharacteristicsForm.reset();
            if (sendCharacteristicsModal) sendCharacteristicsModal.classList.remove('hidden');
        });
    }

    if (sendCharacteristicsModalCloseButton && sendCharacteristicsModal) {
        sendCharacteristicsModalCloseButton.addEventListener('click', function() {
            sendCharacteristicsModal.classList.add('hidden');
        });
    }

    if (sendCharacteristicsModal) {
        sendCharacteristicsModal.addEventListener('click', function(event) {
            if (event.target === sendCharacteristicsModal) {
                sendCharacteristicsModal.classList.add('hidden');
            }
        });
    }

    if (sendCharacteristicsForm) {
        sendCharacteristicsForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = e.target.querySelector('button[type="submit"]');
            
            // Activer l'état de chargement
            showCharacteristicsLoadingState(true, submitButton);

            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;

            if (!csrfToken) {
                showUserNotification('Token CSRF manquant', 'error', 'Caractéristiques');
                showCharacteristicsLoadingState(false, submitButton);
                return;
            }

            const characteristicsData = {
                marque: document.getElementById('selectMarque')?.value || '',
                model: document.getElementById('selectModel')?.value || '',
                processeur: document.getElementById('selectProcesseur')?.value || '',
                ram: document.getElementById('selectRam')?.value || '',
                disque: document.getElementById('selectDisque')?.value || '',
                employe_concerne: document.getElementById('selectEmployeConcerne')?.value || '',
            };

            try {
                const response = await fetch(window.envoyercaracteristiquesUrl, { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify(characteristicsData)
                });

                const result = await response.json();

                if (response.ok) {
                    showUserNotification(result.message, 'success', 'Caractéristiques');
                    sendCharacteristicsModal.classList.add('hidden');
                    setTimeout(() => location.reload(), 2000); // Délai pour voir la notification
                } else {
                    showUserNotification('Erreur : ' + result.error, 'error', 'Caractéristiques');
                }
            } catch (error) {
                console.error('Erreur lors de l\'envoi des caractéristiques:', error);
                showUserNotification('Une erreur est survenue lors de l\'envoi des données.', 'error', 'Caractéristiques');
            } finally {
                
                showCharacteristicsLoadingState(false, submitButton);
            }
        });
    }
}

/**
 * Gère l'état de chargement pour les formulaires utilisateur
 * @param {boolean} isLoading - État de chargement
 * @param {HTMLElement} submitButton - Bouton de soumission
 */
function showUserLoadingState(isLoading, submitButton) {
    if (!submitButton) return;
    
    if (isLoading) {
        // Sauvegarder le texte original
        submitButton.dataset.originalText = submitButton.innerHTML;
        
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement en cours...';
        submitButton.style.opacity = '0.7';
        
        // Ajouter une classe pour le style
        submitButton.classList.add('loading');
    } else {
        // Restaurer l'état original
        submitButton.disabled = false;
        submitButton.innerHTML = submitButton.dataset.originalText || 'Ajouter Utilisateur';
        submitButton.style.opacity = '1';
        
        // Retirer la classe de chargement
        submitButton.classList.remove('loading');
    }
}

/**
 * Affiche une notification pour les opérations utilisateur
 * @param {string} message - Message à afficher
 * @param {string} type - Type de notification (success, error, info)
 */


/**
 * Gère l'état de chargement pour les formulaires de caractéristiques
 * @param {boolean} isLoading - État de chargement
 * @param {HTMLElement} submitButton - Bouton de soumission
 */
function showCharacteristicsLoadingState(isLoading, submitButton) {
    if (!submitButton) return;
    
    if (isLoading) {
        submitButton.dataset.originalText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
        submitButton.style.opacity = '0.7';
        
        submitButton.classList.add('loading');
    } else {
        // Restaurer l'état original
        submitButton.disabled = false;
        submitButton.innerHTML = submitButton.dataset.originalText || 'Envoyer';
        submitButton.style.opacity = '1';
        
        submitButton.classList.remove('loading');
    }
}

/**
 * Affiche une notification pour les opérations de caractéristiques
 * @param {string} message - Message à afficher
 * @param {string} type - Type de notification (success, error, info)
 */
function showCharacteristicsNotification(message, type = 'info') {
    // Utiliser la fonction de notification unifiée
    showUserNotification(message, type, 'Caractéristiques');
}

// Export des fonctions pour utilisation dans d'autres modules
window.DashboardUserManagement = {
    initUserManagement,
    initPcAssignment,
    initUserCrud,
    initEmployeeManagement,
    initCharacteristics
};
