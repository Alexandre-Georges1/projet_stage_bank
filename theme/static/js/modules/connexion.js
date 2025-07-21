document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('form');
    const choiceModal = document.getElementById('choiceModal');
    const modalCloseButton = choiceModal.querySelector('.modal-close-button');
    const specificDashboardBtn = document.getElementById('specificDashboardBtn');
    const generalDashboardBtn = document.getElementById('generalDashboardBtn');
    const modalUserRoleSpan = document.getElementById('modalUserRole');

    function displayMessage(message, type = 'error') {
        alert(message); 
    }
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        try {
            const response = await fetch(loginForm.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrfToken
                },
                body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
            });
            const result = await response.json();
            if (result.success) {
                if (result.choice_required) {
                    // Afficher le modal de choix
                    modalUserRoleSpan.textContent = result.user_role;
                    specificDashboardBtn.href = result.specific_dashboard_url;
                    generalDashboardBtn.href = result.general_dashboard_url;
                    choiceModal.classList.remove('hidden');
                } else {
                    // Redirection directe pour Admin et Employe
                    window.location.href = result.redirect_url;
                }
            } else {
                displayMessage(result.error || 'Une erreur de connexion est survenue.');
            }
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            displayMessage('Une erreur est survenue lors de la connexion.');
        }
    });
    modalCloseButton.addEventListener('click', function() {
        choiceModal.classList.add('hidden');
    });
    choiceModal.addEventListener('click', function(event) {
        if (event.target === choiceModal) {
            choiceModal.classList.add('hidden');
        }
    });
});
