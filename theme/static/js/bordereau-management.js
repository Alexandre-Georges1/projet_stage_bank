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

// Fonction pour basculer l'état du bouton d'acceptation
function toggleAcceptButton() {
    console.log("=== TOGGLE ACCEPT BUTTON ===");
    const checkbox = document.getElementById('bordereauCheckbox');
    const button = document.getElementById('acceptBordereauBtn');
    
    if (checkbox && button) {
        button.disabled = !checkbox.checked;
        console.log("Checkbox état:", checkbox.checked);
        console.log("Bouton disabled:", button.disabled);
    } else {
        console.error("Checkbox ou bouton non trouvé");
        console.log("Checkbox:", checkbox);
        console.log("Button:", button);
    }
}

// Fonction pour accepter un bordereau
function handleAcceptBordereau() {
    alert("Fonction handleAcceptBordereau appelée !"); // Debug immédiat
    console.log("=== DÉBUT HANDLE ACCEPT BORDEREAU ===");
    
    try {
        const button = document.getElementById('acceptBordereauBtn');
        if (!button) {
            alert("Bouton non trouvé !");
            console.error("Bouton acceptBordereauBtn non trouvé");
            return;
        }
        
        console.log("Bouton trouvé:", button);
        alert("Bouton trouvé, recherche du token CSRF...");
        
        // Méthode 1: Meta tag
        let csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        console.log("CSRF depuis meta:", csrfToken);
        
        // Méthode 2: Hidden input
        if (!csrfToken) {
            csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]')?.value;
            console.log("CSRF depuis input:", csrfToken);
        }
        
        // Méthode 3: Cookie
        if (!csrfToken) {
            csrfToken = getCookie('csrftoken');
            console.log("CSRF depuis cookie:", csrfToken);
        }
        
        if (!csrfToken) {
            alert("Token CSRF non trouvé !");
            console.error("Token CSRF non trouvé");
            return;
        }
        
        alert("Token CSRF trouvé: " + csrfToken.substring(0, 10) + "...");
        console.log("Token CSRF trouvé:", csrfToken);
        
        // Désactiver le bouton
        button.disabled = true;
        button.textContent = 'Traitement en cours...';
        
        alert("Envoi de la requête AJAX...");
        console.log("Envoi de la requête AJAX vers /accepter-bordereau/");
        
        // Requête AJAX
        fetch('/accepter-bordereau/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({})
        })
        .then(response => {
            console.log("Réponse reçue:", response);
            alert("Réponse reçue, status: " + response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Données reçues:", data);
            alert("Succès ! Data: " + JSON.stringify(data));
            
            if (data.success) {
                // Masquer le bouton
                button.style.display = 'none';
                
                // Afficher le message de succès
                const messageElement = document.getElementById('messageBordereauAccept');
                if (messageElement) {
                    messageElement.textContent = `Bordereau accepté le ${data.date_acceptation}`;
                    messageElement.style.display = 'block';
                    messageElement.style.color = 'green';
                    console.log("Message de succès affiché");
                }
                
                alert("Bordereau accepté avec succès !");
            } else {
                throw new Error(data.message || 'Erreur inconnue');
            }
        })
        .catch(error => {
            console.error("Erreur:", error);
            alert("Erreur: " + error.message);
            
            // Réactiver le bouton
            button.disabled = false;
            button.textContent = 'Marquer comme Lu et Accepté';
        });
        
    } catch (error) {
        console.error("Erreur dans handleAcceptBordereau:", error);
        alert("Erreur catch: " + error.message);
    }
    
    console.log("=== FIN HANDLE ACCEPT BORDEREAU ===");
}

// Rendre les fonctions globalement accessibles
window.toggleAcceptButton = toggleAcceptButton;
window.handleAcceptBordereau = handleAcceptBordereau;

// Debug au chargement
console.log("Fichier bordereau-management.js chargé");
console.log("Fonctions disponibles:", {
    toggleAcceptButton: typeof window.toggleAcceptButton,
    handleAcceptBordereau: typeof window.handleAcceptBordereau
});
