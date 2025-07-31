/**
 * ===============================
 * USER MANAGEMENT : Gestion des utilisateurs
 * ===============================
 */

// Fonction de notification unifiée pour le module User Management
function showUserNotification(message, type = 'success', title = null) {
    // Vérifier si le système de notifications est disponible
    if (window.NotificationSystem && typeof window.NotificationSystem.show === 'function') {
        return window.NotificationSystem.show(message, type, title ? { title } : {});
    } else {
        // Fallback avec alert coloré
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        const icon = icons[type] || 'ℹ️';
        alert(`${icon} ${title ? title + ': ' : ''}${message}`);
    }
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
        userTable.addEventListener('click', async function(e) {
            if (e.target.closest('.btn-modifier')) {
                const row = e.target.closest('tr');
                if (row) {
                    const userId = row.dataset.userId;
                    const cells = row.querySelectorAll('td');
                    
                    if (cells.length >= 10) {
                        const nom = cells[0].textContent;
                        const prenom = cells[1].textContent;
                        const login = cells[2].textContent;
                        const matricule = cells[4].textContent;
                        const telephone = cells[5].textContent;
                        const email = cells[6].textContent;
                        const departement = cells[7].textContent;
                        const dateEmbauche = cells[8].textContent;
                        const fonction = cells[9].textContent;
                        
                        if (addUserModalTitle) addUserModalTitle.textContent = 'Modifier un Utilisateur';
                        if (addUserName) addUserName.value = nom;
                        if (addUserPrenom) addUserPrenom.value = prenom;
                        if (addUserLogin) addUserLogin.value = login;
                        if (addUserMatricule) addUserMatricule.value = matricule;
                        if (addUserTelephone) addUserTelephone.value = telephone;
                        if (addUserEmail) addUserEmail.value = email;
                        if (addUserDepartement) addUserDepartement.value = departement;
                        if (addUserDateEmbauche) addUserDateEmbauche.value = dateEmbauche;
                        if (addUserFonction) addUserFonction.value = fonction;
                        if (addUserSubmitBtn) addUserSubmitBtn.textContent = 'Enregistrer les modifications';

                        if (addUserForm) {
                            addUserForm.dataset.mode = 'edit';
                            addUserForm.dataset.userId = userId;
                        }

                        if (addUserModal) addUserModal.classList.remove('hidden');
                    }
                }
            } else if (e.target.closest('.btn-supprimer')) {
                const row = e.target.closest('tr');
                if (row) {
                    const userId = row.dataset.userId;
                    const nom = row.cells[0]?.textContent || '';
                    const prenom = row.cells[1]?.textContent || '';
                    
                    if (confirm('Voulez-vous vraiment supprimer l\'utilisateur : ' + nom + ' ' + prenom + ' ?')) {
                        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
                        const url = window.supprimerUtilisateurUrl?.replace('0', userId);
                        
                        if (!csrfToken || !url) {
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
                                showUserNotification(result.message, 'success', 'Utilisateur Supprimé');
                                row.remove();
                            } else {
                                showUserNotification('Erreur lors de la suppression : ' + result.error, 'error', 'Échec Suppression');
                            }
                        } catch (error) {
                            console.error('Erreur lors de la suppression de l\'utilisateur:', error);
                        }
                    }
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
                    // Afficher un message de succès avec icône
                    showUserNotification(result.message, 'success', 'Employé Ajouté');
                    nouvelEmployeForm.reset(); 
                    
                    // Délai avant rechargement pour que l'utilisateur voie le message
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                } else {
                    showUserNotification('Erreur : ' + (result.error || text), 'error', 'Échec Ajout Employé');
                }

            } catch (error) {
                console.error('Erreur lors de l\'envoi des données employé:', error);
                showEmployeeNotification('Une erreur est survenue lors de l\'envoi des données.', 'error');
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
function showEmployeeNotification(message, type = 'info') {
    // Créer ou réutiliser un conteneur de notification
    let notificationContainer = document.getElementById('employee-notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'employee-notification-container';
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
    if (!document.getElementById('notification-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'notification-styles';
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

// Initialisation de la gestion des caractéristiques
function initCharacteristics() {
    // Demande de caractéristique
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
                    showCharacteristicsNotification(result.message, 'success');
                    demandeCaracteristiqueForm.reset(); 
                } else {
                    showCharacteristicsNotification('Erreur : ' + result.error, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de l\'envoi de la demande de caractéristique:', error);
                showCharacteristicsNotification('Une erreur est survenue lors de l\'envoi des données.', 'error');
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
                showCharacteristicsNotification('Token CSRF manquant', 'error');
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
                    showCharacteristicsNotification(result.message, 'success');
                    sendCharacteristicsModal.classList.add('hidden');
                    setTimeout(() => location.reload(), 1500); // Délai pour voir la notification
                } else {
                    showCharacteristicsNotification('Erreur : ' + result.error, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de l\'envoi des caractéristiques:', error);
                showCharacteristicsNotification('Une erreur est survenue lors de l\'envoi des données.', 'error');
            } finally {
                // Désactiver l'état de chargement
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
        
        // Afficher l'indicateur de chargement
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
function showUserNotification(message, type = 'info') {
    // Réutiliser la même fonction que pour les employés
    if (typeof showEmployeeNotification === 'function') {
        showEmployeeNotification(message, type);
    } else {
        // Fallback vers une alerte simple
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        alert(`${icon} ${message}`);
    }
}

/**
 * Gère l'état de chargement pour les formulaires de caractéristiques
 * @param {boolean} isLoading - État de chargement
 * @param {HTMLElement} submitButton - Bouton de soumission
 */
function showCharacteristicsLoadingState(isLoading, submitButton) {
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
