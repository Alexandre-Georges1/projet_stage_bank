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
      .forEach(btn => btn.addEventListener('click', ()=> {
        // Restaure l'état par défaut du formulaire PC ancien
        const f = document.getElementById('addPcAncienForm');
        if (f) {
          delete f.dataset.mode;
          delete f.dataset.ancienId;
      delete f.dataset.attribueId;
      delete f.dataset.dateAttribution;
      delete f.dataset.dateFinAttribution;
          const s = f.querySelector('button[type="submit"]');
          if (s) s.innerHTML = '<i class="fas fa-plus"></i> Ajouter PC ancien';
        }
        close(btn.dataset.close)
      }));

    const getCsrf = () => document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';

    // Soumission ajout PC ancien
    const addForm = document.getElementById('addPcAncienForm');
  if (addForm) {
      addForm.addEventListener('submit', async (e)=>{
        // Si on est en mode édition, ne pas déclencher le flux d'ajout
    if (addForm.dataset && (addForm.dataset.mode === 'edit-ancien' || addForm.dataset.mode === 'edit-ancien-attribue')) {
          return;
        }
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

    // Edition/Suppression dans le tableau Catalogue Ancien
    const ancienTable = document.querySelector('#catalogue-ancien-view table tbody');
    const modalEl = document.getElementById('addPcAncienModal');
    const form = document.getElementById('addPcAncienForm');
    const fMarque = document.getElementById('ancienMarque');
    const fModele = document.getElementById('ancienModele');
    const fProc = document.getElementById('ancienProcesseur');
    const fRam = document.getElementById('ancienRam');
    const fDisque = document.getElementById('ancienDisque');
    const fSerial = document.getElementById('ancienSerial');
    const fDate = document.getElementById('ancienDateAchat');
    const fEmploye = document.getElementById('ancienEmploye');

    const toIso = (raw) => {
      if(!raw) return '';
      const r = raw.trim();
      if(/^\d{4}-\d{2}-\d{2}$/.test(r)) return r;
      const m = r.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
    };

    if (ancienTable) {
      ancienTable.addEventListener('click', async (e)=>{
        const row = e.target.closest('tr[data-ancien-id]');
        if (!row) return;
        const id = row.getAttribute('data-ancien-id');
        if (e.target.closest('.btn-modifier')) {
          // Pré-remplir depuis les cellules (ordre des colonnes connu)
          const tds = row.querySelectorAll('td');
          const marque = tds[0]?.textContent?.trim() || '';
          const modele = tds[1]?.textContent?.trim() || '';
          const proc = tds[2]?.textContent?.trim() || '';
          const ram = tds[3]?.textContent?.trim() || '';
          const disque = tds[4]?.textContent?.trim() || '';
          const serial = tds[5]?.textContent?.trim() || '';
          const dateIso = row.dataset.dateAchat || '';
          const employeId = row.dataset.employeId || '';

          if (fMarque) fMarque.value = marque;
          if (fModele) fModele.value = modele;
          if (fProc) fProc.value = proc;
          if (fRam) fRam.value = ram;
          if (fDisque) fDisque.value = disque;
          if (fSerial) fSerial.value = serial;
          if (fDate) fDate.value = dateIso;
          if (fEmploye) fEmploye.value = employeId || '';

          if (form) {
            form.dataset.mode = 'edit-ancien';
            form.dataset.ancienId = id;
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Enregistrer';
          }
          // Ouvrir la modale après pré-remplissage
          open('addPcAncienModal');
        } else if (e.target.closest('.btn-supprimer')) {
          // Suppression directe (même comportement que le catalogue des PC)
          const url = (window.supprimerPcAncienUrl || '/pc-anciens/0/supprimer/').replace('0', id);
          try {
            const r = await fetch(url, { method:'POST', headers: { 'X-CSRFToken': getCsrf() } });
            const data = await r.json().catch(()=>({}));
            if (r.ok) {
              row.remove();
              window.NotificationSystem?.success(data.message || 'PC ancien supprimé', { title:'Supprimé' });
            } else {
              window.NotificationSystem?.error(data.error || 'Échec suppression', { title:'Erreur' });
            }
          } catch(err) {
            console.error(err);
            window.NotificationSystem?.error('Erreur réseau', { title:'Suppression' });
          }
        }
      });
    }

    // Intercepter la soumission en mode édition pour Pc_ancien
    if (form) {
      form.addEventListener('submit', async (e)=>{
        if (form.dataset.mode === 'edit-ancien') {
          e.preventDefault();
          if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
          const id = form.dataset.ancienId;
          const url = (window.modifierPcAncienUrl || '/pc-anciens/0/modifier/').replace('0', id);
          const fd = new FormData(form);
          const payload = Object.fromEntries(fd.entries());
          const submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn) { submitBtn.disabled=true; submitBtn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Sauvegarde...'; }
          try {
            const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrf() }, body: JSON.stringify(payload) });
            const data = await r.json().catch(()=>({}));
            if (r.ok) {
              window.NotificationSystem?.success(data.message || 'Modifié', { title:'PC ancien' });
              setTimeout(()=> window.location.reload(), 800);
            } else {
              window.NotificationSystem?.error(data.error || 'Échec modification', { title:'Erreur' });
            }
          } catch(err) {
            console.error(err);
            window.NotificationSystem?.error('Erreur réseau', { title:'Modification' });
          } finally {
            if (submitBtn) { submitBtn.disabled=false; submitBtn.innerHTML='<i class="fas fa-plus"></i> Ajouter PC ancien'; }
            // Nettoyer le mode pour les futurs ajouts
            delete form.dataset.mode;
            delete form.dataset.ancienId;
          }
        }
      }, true);
    }
  });
})();

// Gestion des PC anciens attribués: modifier / supprimer
(function initPcAnciensAttribues(){
  document.addEventListener('DOMContentLoaded', function(){
  
  const firstAttribueRow = document.querySelector('#catalogue-ancien-view tr[data-ancien-attribue-id]');
  const table = firstAttribueRow ? firstAttribueRow.closest('tbody') : null;
    if (!table) return;

    const getCsrf = () => document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    const form = document.getElementById('addPcAncienForm');
    const fMarque = document.getElementById('ancienMarque');
    const fModele = document.getElementById('ancienModele');
    const fProc = document.getElementById('ancienProcesseur');
    const fRam = document.getElementById('ancienRam');
    const fDisque = document.getElementById('ancienDisque');
    const fSerial = document.getElementById('ancienSerial');
    const fDate = document.getElementById('ancienDateAchat');
    const fEmploye = document.getElementById('ancienEmploye');

  // Dates déjà fournies en ISO via data-attributes dans le template

    table.addEventListener('click', async (e)=>{
      const row = e.target.closest('tr[data-ancien-attribue-id]');
      if (!row) return;
      const id = row.getAttribute('data-ancien-attribue-id');
      if (e.target.closest('.btn-modifier')) {
        // Préremplir et réutiliser la même modale d'ajout (édition logique côté serveur dédiée aux attributions)
  const tds = row.querySelectorAll('td');
  const marque = tds[0]?.textContent?.trim() || '';
  const modele = tds[1]?.textContent?.trim() || '';
  const serial = tds[2]?.textContent?.trim() || '';
  const employeId = row.dataset.employeId || '';
  const dateAttr = row.dataset.dateAttr || '';
  const dateFin = row.dataset.dateFin || '';

        if (fMarque) fMarque.value = marque;
        if (fModele) fModele.value = modele;
        if (fSerial) fSerial.value = serial;
        if (fDate) fDate.value = ''; // On n'édite pas date_achat ici
  if (fEmploye) fEmploye.value = employeId;

        // Marquer le formulaire en mode édition attribution
        if (form) {
          form.dataset.mode = 'edit-ancien-attribue';
          form.dataset.attribueId = id;
          const submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Enregistrer';
        }
        if (window.openModal) window.openModal('addPcAncienModal'); else document.getElementById('addPcAncienModal')?.classList.remove('hidden');
  // Stocker aussi les dates sur le form pour envoi
  form.dataset.dateAttribution = dateAttr;
  form.dataset.dateFinAttribution = dateFin;
      } else if (e.target.closest('.btn-supprimer')) {
        const url = (window.supprimerPcAncienAttribueUrl || '/pc-anciens-attribues/0/supprimer/').replace('0', id);
        try {
          const r = await fetch(url, { method: 'POST', headers: { 'X-CSRFToken': getCsrf() } });
          const data = await r.json().catch(()=>({}));
          if (r.ok) {
            row.remove();
            window.NotificationSystem?.success(data.message || 'Supprimé', { title:'PC ancien attribué' });
          } else {
            window.NotificationSystem?.error(data.error || 'Échec suppression', { title:'Erreur' });
          }
        } catch(err) {
          console.error(err);
          window.NotificationSystem?.error('Erreur réseau', { title:'Suppression' });
        }
      }
    });

    // Intercepter la soumission du formulaire en mode edit-ancien-attribue
    if (form) {
      form.addEventListener('submit', async (e)=>{
        if (form.dataset.mode === 'edit-ancien-attribue') {
          e.preventDefault();
          if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
          const id = form.dataset.attribueId;
          const url = (window.modifierPcAncienAttribueUrl || '/pc-anciens-attribues/0/modifier/').replace('0', id);
          const fd = new FormData(form);
          const payload = Object.fromEntries(fd.entries());
          // Ajouter les dates conservées
          if (form.dataset.dateAttribution) payload.date_attribution = form.dataset.dateAttribution;
          if (form.dataset.dateFinAttribution) payload.date_fin_attribution = form.dataset.dateFinAttribution;

          const submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn) { submitBtn.disabled=true; submitBtn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Sauvegarde...'; }
          try {
            const r = await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json', 'X-CSRFToken': getCsrf() }, body: JSON.stringify(payload) });
            const data = await r.json().catch(()=>({}));
            if (r.ok) {
              window.NotificationSystem?.success(data.message || 'Modifié', { title:'PC ancien attribué' });
              setTimeout(()=> window.location.reload(), 800);
            } else {
              window.NotificationSystem?.error(data.error || 'Échec modification', { title:'Erreur' });
            }
          } catch(err) {
            console.error(err);
            window.NotificationSystem?.error('Erreur réseau', { title:'Modification' });
          } finally {
            if (submitBtn) { submitBtn.disabled=false; submitBtn.innerHTML='<i class="fas fa-plus"></i> Ajouter PC ancien'; }
            delete form.dataset.mode; delete form.dataset.attribueId; delete form.dataset.dateAttribution; delete form.dataset.dateFinAttribution;
          }
        }
      }, true);
    }
  });
})();
