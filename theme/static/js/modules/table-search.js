(function(){
  const strip = (s='') => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const matches = (text, q) => strip(text).includes(strip(q));

  // Mots-clés pour détecter les colonnes
  const headerMap = {
    nom: ['nom','name'],
    prenom: ['prénom','prenom','first name','firstname'],
    serial: ['numéro de série','numero de serie','n° série','n° serie','serial','serial number'],
    employe: ['employé','employe']
  };

  function detectColumns(table){
    const ths = Array.from(table.querySelectorAll('thead th'));
    const idx = { nom: -1, prenom: -1, serial: -1 };
    ths.forEach((th,i)=>{
      const t = strip(th.textContent);
      if (headerMap.nom.some(k=>t.includes(strip(k)))) idx.nom = i;
      if (headerMap.prenom.some(k=>t.includes(strip(k)))) idx.prenom = i;
      if (headerMap.serial.some(k=>t.includes(strip(k)))) idx.serial = i;
      // Si une colonne "Employé" unique est présente, on l'utilise comme filtre nom
      if (idx.nom < 0 && headerMap.employe.some(k=>t.includes(strip(k)))) idx.nom = i;
    });
    return idx;
  }

  function buildFilterRow(table, cols){
    const thead = table.querySelector('thead');
    if (!thead) return null;
    const thCount = thead.querySelectorAll('th').length || (table.rows[0]?.cells.length || 0);

    const tr = document.createElement('tr');
    tr.className = 'search-row';
    for (let i=0;i<thCount;i++){
      const td = document.createElement('td');
      if (i===cols.nom || i===cols.prenom || i===cols.serial){
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'table-filter-input';
        input.dataset.col = i;
        input.placeholder = i===cols.nom ? 'Rechercher nom...' : (i===cols.prenom ? 'Rechercher prénom...' : 'Rechercher N° série...');
        td.appendChild(input);
      } else {
        td.innerHTML = '';
      }
      tr.appendChild(td);
    }
    thead.appendChild(tr);
    return tr;
  }

  function applyFilter(table){
    const inputs = Array.from(table.querySelectorAll('.search-row .table-filter-input')).filter(i=>i.value.trim()!=='');
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr'));

    rows.forEach(row=>{
      if (row.querySelector('td[colspan]')) return; // ignorer lignes vides/info
      const cells = row.querySelectorAll('td');
      const visible = inputs.every(inp => {
        const idx = Number(inp.dataset.col);
        const txt = cells[idx]?.textContent || '';
        return matches(txt, inp.value);
      });
      row.style.display = visible ? '' : 'none';
    });
  }

  const debounce = (fn, d=150)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), d); }; };

  function attach(table){
    const cols = detectColumns(table);
    if (cols.nom<0 && cols.prenom<0 && cols.serial<0) return; // aucune colonne pertinente détectée
    let row = table.querySelector('.search-row');

    if (!row) {
      row = buildFilterRow(table, cols);
      if (!row) return;
      row.addEventListener('input', debounce(()=>applyFilter(table), 120));
    } else {
      // toggle off: retirer la ligne et reset
      row.remove();
      const tbody = table.querySelector('tbody');
      if (tbody) Array.from(tbody.querySelectorAll('tr')).forEach(r=>r.style.display='');
      return;
    }
  }

  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.head .bx-search');
    if (!btn) return;
    const order = btn.closest('.order');
    const table = order?.querySelector('table');
    if (table) attach(table);
  });
})();
