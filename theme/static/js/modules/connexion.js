document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.querySelector('form');
    if (!loginForm) return;

    // Zone message légère
    function ensureMessageBox() {
        let box = document.getElementById('loginMessage');
        if (!box) {
            box = document.createElement('div');
            box.id = 'loginMessage';
            box.style.marginBottom = '12px';
            box.style.fontSize = '14px';
            loginForm.parentNode.insertBefore(box, loginForm);
        }
        return box;
    }

    function showMsg(msg, type = 'error') {
        const box = ensureMessageBox();
        box.textContent = msg;
        box.style.color = type === 'success' ? '#065f46' : '#b91c1c';
        box.style.background = type === 'success' ? '#d1fae5' : '#fee2e2';
        box.style.border = `1px solid ${type === 'success' ? '#a7f3d0' : '#fecaca'}`;
        box.style.padding = '10px 12px';
        box.style.borderRadius = '8px';
    }

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const usernameEl = document.getElementById('username');
        const passwordEl = document.getElementById('password');
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';

        const username = usernameEl?.value || '';
        const password = passwordEl?.value || '';
        const url = loginForm.action || window.location.pathname;

        // UI loading
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.dataset._prev = submitBtn.textContent;
            submitBtn.textContent = 'Connexion…';
            submitBtn.setAttribute('aria-busy', 'true');
        }

        try {
            const body = new URLSearchParams({ username, password }).toString();
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrfToken
                },
                body
            });

            let result = null;
            try { result = await response.json(); } catch (_) { /* non-JSON */ }

            if (response.ok && result && result.success) {
                if (result.redirect_url) {
                    window.location.href = result.redirect_url;
                    return;
                }
                // Fallback si pas d'URL
                showMsg('Connexion réussie, redirection…', 'success');
                setTimeout(() => window.location.reload(), 300);
            } else {
                const err = (result && (result.error || result.message)) || 'Identifiant ou mot de passe incorrect.';
                showMsg(err, 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            showMsg('Erreur réseau. Veuillez réessayer.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitBtn.dataset._prev || 'Se connecter';
                submitBtn.removeAttribute('aria-busy');
            }
        }
    });
});
