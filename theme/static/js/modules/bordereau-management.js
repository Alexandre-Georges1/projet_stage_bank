/**
 * ===============================
 * BORDEREAU MANAGEMENT : Gestion des bordereaux
 * ===============================
 */

// Fonction principale d'initialisation de la gestion des bordereaux
function initBordereauManagement() {
    // Gestion du bouton Bordereau dans la liste des attributions
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
                        console.log('Bouton Envoyer demande cliqué !');
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
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    
    if (!csrfToken) {
        alert('Token CSRF manquant');
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
            alert(result.message);
            bordereauModal.classList.add('hidden');
        } else {
            alert("Erreur lors de l'envoi du bordereau : " + result.error);
        }
    } catch (error) {
        console.error("Erreur lors de l'envoi du bordereau:", error);
        alert("Une erreur est survenue lors de l'envoi du bordereau.");
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
        console.error("Éléments non trouvés:", { acceptBtn, messageDiv });
        return;
    }

    // Récupérer le token CSRF
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
                     document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
                     getCookie('csrftoken');
    
    if (!csrfToken) {
        console.error("Token CSRF non trouvé");
        return;
    }

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
        } else {
            console.error("Erreur de réponse:", result);
            alert("Erreur lors de l'acceptation du bordereau : " + result.error);
        }
    } catch (error) {
        console.error("Erreur lors de l'acceptation du bordereau:", error);
        alert("Une erreur est survenue lors de l'acceptation du bordereau.");
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

// Export des fonctions pour utilisation dans d'autres modules
window.DashboardBordereauManagement = {
    initBordereauManagement,
    handleEnvoyerDemande,
    handleDownloadBordereau,
    handleAcceptBordereau
};
