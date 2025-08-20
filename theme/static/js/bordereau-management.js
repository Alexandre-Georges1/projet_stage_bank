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
function toggleAcceptButton() {
    const checkbox = document.getElementById('bordereauCheckbox');
    const button = document.getElementById('acceptBordereauBtn');
    
    if (checkbox && button) {
        button.disabled = !checkbox.checked;
    } else {
        console.error("Checkbox ou bouton non trouvé");
    }
}

// Fonction pour accepter un bordereau
function handleAcceptBordereau() {  
    try {
        const button = document.getElementById('acceptBordereauBtn');
        if (!button) {
            alert("Bouton non trouvé !");
            console.error("Bouton acceptBordereauBtn non trouvé");
            return;
        }
        alert("Bouton trouvé, recherche du token CSRF...");
        
        // Méthode 1: Meta tag
        let csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        // Méthode 2: Hidden input
        if (!csrfToken) {
            csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]')?.value;
        }
        
        // Méthode 3: Cookie
        if (!csrfToken) {
            csrfToken = getCookie('csrftoken');
        }
        
        if (!csrfToken) {
            console.error("Token CSRF non trouvé");
            return;
        } 
        // Désactiver le bouton
        button.disabled = true;
        button.textContent = 'Traitement en cours...';
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
            alert("Réponse reçue, status: " + response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
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
                }
                
                alert("Bordereau accepté avec succès !");
            } else {
                throw new Error(data.message || 'Erreur inconnue');
            }
        })
        .catch(error => {
            console.error("Erreur:", error);  
            // Réactiver le bouton
            button.disabled = false;
            button.textContent = 'Marquer comme Lu et Accepté';
        });
        
    } catch (error) {
        console.error("Erreur dans handleAcceptBordereau:", error);
        alert("Erreur catch: " + error.message);
    }
}

// Rendre les fonctions globalement accessibles
window.toggleAcceptButton = toggleAcceptButton;
window.handleAcceptBordereau = handleAcceptBordereau;


