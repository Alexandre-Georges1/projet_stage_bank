// Table Search Module
// Ajoute un champ de recherche à chaque tableau et filtre ses lignes localement.
(function () {
	'use strict';

	// Debounce utilitaire
	function debounce(fn, delay) {
		let t;
		return function (...args) {
			clearTimeout(t);
			t = setTimeout(() => fn.apply(this, args), delay);
		};
	}

	function getColspan(table) {
		const thead = table.tHead;
		if (thead && thead.rows.length && thead.rows[0].cells.length) {
			return thead.rows[0].cells.length;
		}
		const tb = table.tBodies && table.tBodies[0];
		if (tb && tb.rows.length) {
			return tb.rows[0].cells.length || 1;
		}
		return 1;
	}

	function ensureEmptyRow(table) {
		const tbody = table.tBodies && table.tBodies[0];
		if (!tbody) return null;
		let emptyRow = tbody.querySelector('tr.ts-empty-row');
		if (!emptyRow) {
			emptyRow = document.createElement('tr');
			emptyRow.className = 'ts-empty-row';
			const td = document.createElement('td');
			td.colSpan = getColspan(table);
			td.style.textAlign = 'center';
			td.style.color = '#888';
			td.style.padding = '12px 8px';
			td.textContent = 'Aucun résultat';
			emptyRow.appendChild(td);
			tbody.appendChild(emptyRow);
		}
		emptyRow.style.display = 'none';
		return emptyRow;
	}

	function filterTable(table, query, countEl) {
		const tbody = table.tBodies && table.tBodies[0];
		if (!tbody) return;

		const q = String(query || '').trim().toLowerCase();
		const rows = Array.from(tbody.rows).filter(r => !r.classList.contains('ts-empty-row'));
		let visible = 0;
		if (!q) {
			rows.forEach(r => r.style.display = '');
			visible = rows.length;
		} else {
			rows.forEach(r => {
				if (r.classList.contains('no-search')) { r.style.display = ''; return; }
				const text = r.textContent.toLowerCase();
				const match = text.indexOf(q) !== -1;
				r.style.display = match ? '' : 'none';
				if (match) visible++;
			});
		}
		if (countEl) {
			const total = rows.length;
			countEl.textContent = `${visible}/${total}`;
			countEl.style.display = total ? 'inline-block' : 'none';
		}

		const emptyRow = ensureEmptyRow(table);
		if (emptyRow) {
			emptyRow.style.display = visible === 0 ? '' : 'none';
		}
	}

		function addToolbar(table, options) {
			if (table.dataset.tsInitialized === '1') return; // éviter doublons

			// 1) Essayer d'utiliser l'icône loupe présente dans l'en-tête du bloc
			const order = table.closest('.order');
			const head = order ? order.querySelector(':scope > .head') : null;
			const searchIcon = head ? head.querySelector('.bx-search') : null;
			if (head && searchIcon) {
				// Créer un input inline masqué par défaut dans le header
				const wrap = document.createElement('div');
				wrap.className = 'ts-inline-wrap';
				wrap.style.display = 'none';
				wrap.style.gap = '8px';
				wrap.style.alignItems = 'center';

				const input = document.createElement('input');
				input.type = 'search';
				input.className = 'ts-input';
				input.placeholder = options?.placeholder || 'Rechercher...';
				input.style.padding = '6px 10px';
				input.style.border = '1px solid #e0e0e0';
				input.style.borderRadius = '8px';
				input.style.minWidth = '220px';
				input.setAttribute('aria-label', 'Rechercher');

				const count = document.createElement('span');
				count.className = 'ts-count';
				count.style.fontSize = '12px';
				count.style.color = '#64748b';
				count.style.alignSelf = 'center';
				count.style.minWidth = '48px';
				count.style.textAlign = 'right';

				wrap.appendChild(input);
				wrap.appendChild(count);
				head.appendChild(wrap);

				const applyFilter = debounce(() => filterTable(table, input.value, count), 120);
				input.addEventListener('input', applyFilter);
				input.addEventListener('keydown', (e) => {
					if (e.key === 'Escape') {
						wrap.style.display = 'none';
						if (input.value) {
							input.value = '';
							applyFilter();
						}
					}
				});

				// Toggle à partir de l'icône de recherche
				searchIcon.style.cursor = 'pointer';
				searchIcon.title = 'Rechercher dans ce tableau';
				searchIcon.addEventListener('click', (e) => {
					e.stopPropagation();
					const showing = wrap.style.display !== 'none';
					// Fermer si déjà affiché, sinon afficher et focus
					wrap.style.display = showing ? 'none' : 'inline-flex';
					if (!showing) {
						// Reset filtre si besoin
						// input.value = '';
						// applyFilter();
						input.focus();
						input.select();
					}
				});

				// Clic en dehors pour fermer
				document.addEventListener('click', (evt) => {
					if (!head.contains(evt.target)) {
						if (wrap.style.display !== 'none') {
							wrap.style.display = 'none';
						}
					}
				});

				// Etat initial (affiche le total via compteur)
				filterTable(table, '', count);
				table.dataset.tsInitialized = '1';
				return; // mode header activé
			}
				// Pas d'icône loupe → pas de recherche affichée (comportement demandé)
				table.dataset.tsInitialized = '1';
		}

	function init(selector = '.table-data .order table', options) {
		// Nettoyage: retirer toute ancienne barre fallback si existante
		document.querySelectorAll('.ts-toolbar').forEach(el => el.remove());
		const tables = document.querySelectorAll(selector);
		tables.forEach(t => addToolbar(t, options));
	}

	function attachTo(tableEl, options) {
		if (!tableEl) return;
		addToolbar(tableEl, options);
	}

	// Expose API globale
	window.TableSearch = {
		init,
		attachTo
	};

	// Auto-init au chargement si des tableaux sont présents
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => init());
	} else {
		init();
	}
})();

