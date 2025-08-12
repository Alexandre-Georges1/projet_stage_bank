// Amortissement manuel des PCs (> 4 ans)
// Style: utilise le bouton #btn-amortir-maintenant avec la classe existante "btn-ajouter-manuel"

(function initAmortirManuel(){
  document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('btn-amortir-maintenant');
    if (!btn) return;
  const resultEl = document.getElementById('amortirResult');
    const url = btn.dataset.url || '/amortir-pcs/';

    const getCookie = (name) => {
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
    };

    const getCsrf = () => {
      return document.querySelector('[name=csrfmiddlewaretoken]')?.value || getCookie('csrftoken') || '';
    };

    btn.addEventListener('click', async () => {
      const csrf = getCsrf();
      if (!csrf) {
        // Notification d'erreur si CSRF manquant
        if (window.NotificationSystem?.error) {
          window.NotificationSystem.error('Token CSRF manquant.', { title: 'Amortissement' });
        } else if (resultEl) {
          resultEl.textContent = 'Token CSRF manquant.';
          resultEl.style.color = '#c0392b';
        }
        return;
      }

      btn.disabled = true;
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
      if (resultEl) resultEl.textContent = '';

      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'X-CSRFToken': csrf }
        });
        const data = await resp.json().catch(() => ({}));
        if (resp.ok && data.ok) {
          const moved = Number(data.moved || 0);
          if (moved > 0) {
            if (window.NotificationSystem?.success) {
              window.NotificationSystem.success(`${moved} PC(s) amorti(s).`, { title: 'Amortissement' });
            } else if (resultEl) {
              resultEl.textContent = `${moved} PC(s) amorti(s).`;
              resultEl.style.color = '#2c7a7b';
            }
            setTimeout(() => window.location.reload(), 1000);
          } else {
            if (window.NotificationSystem?.info) {
              window.NotificationSystem.info('Aucun PC à amortir.', { title: 'Amortissement' });
            } else if (resultEl) {
              resultEl.textContent = 'Aucun PC à amortir.';
              resultEl.style.color = '#6b7280';
            }
          }
        } else {
          const msg = data?.error || 'Erreur lors de l\'amortissement.';
          if (window.NotificationSystem?.error) {
            window.NotificationSystem.error(msg, { title: 'Amortissement' });
          } else if (resultEl) {
            resultEl.textContent = msg;
            resultEl.style.color = '#c0392b';
          }
        }
      } catch (e) {
        console.error(e);
        if (window.NotificationSystem?.error) {
          window.NotificationSystem.error("Erreur réseau lors de l'amortissement.", { title: 'Amortissement' });
        } else if (resultEl) {
          resultEl.textContent = "Erreur réseau lors de l'amortissement.";
          resultEl.style.color = '#c0392b';
        }
      } finally {
        btn.disabled = false;
        btn.innerHTML = original;
      }
    });
  });
})();
