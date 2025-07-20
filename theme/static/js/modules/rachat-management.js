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
            // Afficher les informations du PC
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
            // Gérer les erreurs (ex: 401, 404, 500)
            console.error('Erreur lors de la récupération des informations du PC de rachat:', result.error || 'Erreur inconnue');
            alert('Une erreur est survenue lors du chargement des informations de rachat: ' + (result.error || 'Veuillez réessayer.'));
            if (racheterPcRow) racheterPcRow.classList.add('hidden');
            if (noPcAttributedMessage) {
                noPcAttributedMessage.classList.remove('hidden');
                noPcAttributedMessage.textContent = 'Erreur lors du chargement des données.';
            }
        }
    } catch (error) {
        console.error('Erreur réseau lors de la récupération des informations du PC de rachat:', error);
        alert('Erreur réseau ou serveur lors du chargement des informations de rachat.');
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
    // Gestion du bouton "Envoyer demande" pour rachat
    const btnRachat = document.querySelector('.btn-Envoyer-Demande_de_rachat');
    if (btnRachat) {
        btnRachat.addEventListener('click', async function(e) {
            e.preventDefault();
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
            
            if (!csrfToken) {
                alert('Token CSRF manquant');
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
                    alert(result.message);
                    setTimeout(fetchRacheterPcInfo, 500); // Rafraîchir le statut après succès
                } else {
                    alert("Erreur lors de l'envoi de la demande : " + result.error);
                }
            } catch (error) {
                console.error("Erreur réseau :", error);
                alert("Une erreur s'est produite lors de l'envoi.");
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
                alert("Impossible de trouver l'ID du PC pour cette ligne.");
                return;
            }
            
            const action = btn.textContent.trim().toLowerCase(); // 'valider' ou 'refuser'
            const userFonction = window.connectedUserFonction;
            
            if (!['RMG','DAF'].includes(userFonction)) {
                alert('Votre fonction n\'est pas reconnue ou vous n\'êtes pas connecté.');
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
                alert('Token CSRF manquant');
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
                } else if (data.error) {
                    alert('Erreur : ' + data.error);
                }
            })
            .catch(err => {
                alert('Erreur AJAX : ' + err);
                console.error('[DEBUG] Erreur AJAX', err);
            });
            
            e.preventDefault();
        }
    });
}

// Export des fonctions pour utilisation dans d'autres modules
window.DashboardRachatManagement = {
    initRachatManagement,
    fetchRacheterPcInfo
};
