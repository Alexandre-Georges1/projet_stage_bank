// Gestion des PC anciens: ouverture des modales et soumissions via fetch
(function initPcAnciens() {
  document.addEventListener('DOMContentLoaded', function() {
    const btnAdd = document.getElementById('btn-ajouter-pc-ancien');
    const btnAssign = document.getElementById('btn-assigner-pc-ancien');

    const open = (id) => {
      if (window.openModal) return window.openModal(id);
      const el = document.getElementById(id); if (el) el.classList.remove('hidden');
    };
    const close = (id) => {
      if (window.closeModal) return window.closeModal(id);
      const el = document.getElementById(id); if (el) el.classList.add('hidden');
    };

    if (btnAdd) btnAdd.addEventListener('click', ()=> open('addPcAncienModal'));
    if (btnAssign) btnAssign.addEventListener('click', ()=> open('assignPcAncienModal'));

    // Gestion fermeture via croix
    document.querySelectorAll('.modern-close-btn[data-close]')
      .forEach(btn => btn.addEventListener('click', ()=> close(btn.dataset.close)));

    const getCsrf = () => document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';

    // Soumission ajout PC ancien
    const addForm = document.getElementById('addPcAncienForm');
    if (addForm) {
      addForm.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const url = addForm.getAttribute('action') || (window.ajouterPcAncienUrl || '/pc-anciens/ajouter/');
        const fd = new FormData(addForm);
        const payload = Object.fromEntries(fd.entries());
        const submitBtn = addForm.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled=true; submitBtn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Traitement...'; }
        try {
          const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrf() },
            body: JSON.stringify(payload)
          });
          const data = await r.json().catch(()=>({}));
          if (r.ok) {
            window.NotificationSystem?.success(data.message || 'Ajout réussi', { title: 'PC ancien' });
            setTimeout(()=> window.location.reload(), 800);
          } else {
            window.NotificationSystem?.error(data.error || 'Echec ajout', { title: 'PC ancien' });
          }
        } catch(err) {
          console.error(err);
          window.NotificationSystem?.error('Erreur réseau', { title: 'PC ancien' });
        } finally {
          if (submitBtn) { submitBtn.disabled=false; submitBtn.innerHTML='<i class="fas fa-plus"></i> Ajouter PC ancien'; }
        }
      });
    }

    // Soumission attribution PC ancien
    const assignForm = document.getElementById('assignPcAncienForm');
    if (assignForm) {
      assignForm.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const url = assignForm.getAttribute('action') || (window.assignPcAncienUrl || '/pc-anciens/assigner/');
        const fd = new FormData(assignForm);
        const payload = Object.fromEntries(fd.entries());
        const submitBtn = assignForm.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled=true; submitBtn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Traitement...'; }
        try {
          const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrf() },
            body: JSON.stringify(payload)
          });
          const data = await r.json().catch(()=>({}));
          if (r.ok) {
            window.NotificationSystem?.success(data.message || 'Attribution réussie', { title: 'PC ancien' });
            setTimeout(()=> window.location.reload(), 800);
          } else {
            window.NotificationSystem?.error(data.error || 'Echec attribution', { title: 'PC ancien' });
          }
        } catch(err) {
          console.error(err);
          window.NotificationSystem?.error('Erreur réseau', { title: 'PC ancien' });
        } finally {
          if (submitBtn) { submitBtn.disabled=false; submitBtn.innerHTML='<i class="fas fa-link"></i> Attribuer'; }
        }
      });
    }
  });
})();
