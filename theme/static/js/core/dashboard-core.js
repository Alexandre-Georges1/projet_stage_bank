/**
 * ===============================
 * DASHBOARD CORE : Navigation et initialisation
 * ===============================
 */
// Fonction principale de changement de vue
function switchView(viewId) {
    // Cacher toutes les vues
    document.querySelectorAll('main > div').forEach(view => {
        view.classList.add('hidden');
    });
    
    // Afficher la vue sélectionnée
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.remove('hidden');

        // Si la vue est 'Racheter-view', charger les informations du PC
        if (viewId === 'Racheter-view' && typeof fetchRacheterPcInfo === 'function') {
            fetchRacheterPcInfo();
        }

    } else {
        console.error('View not found:', viewId);
    }
    
    // Mettre à jour les styles des éléments du menu
    document.querySelectorAll('#sidebar .side-menu li').forEach(item => {
        item.classList.remove('active');
    });
    
    // Activer le bouton correspondant
    const btnId = viewId.replace('-view', '-btn');
    const activeBtn = document.getElementById(btnId);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// Fonction pour vérifier la visibilité réelle d'un élément
function isReallyVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    const visible = (
        el.offsetParent !== null &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        !el.classList.contains('d-none') &&
        el.offsetWidth > 0 &&
        el.offsetHeight > 0
    );
    return visible;
}
function initNavigation() {
    console.log('DOMContentLoaded fired');
    const menuItems = document.querySelectorAll('#sidebar .side-menu li');
    // Gestion des clics sur le menu
    menuItems.forEach(menuItem => {
        menuItem.addEventListener('click', function() {
            console.log('Clic sur un élément du menu !', this.id);
            const viewId = this.id.replace('-btn', '-view');
            console.log('viewId calculé :', viewId);
            switchView(viewId);
        });
    });
    // Cacher toutes les vues au chargement
    document.querySelectorAll('main > div').forEach(view => {
        view.classList.add('hidden');
    });

    let firstVisibleMenu = null;
    for (let i = 0; i < menuItems.length; i++) {
        if (isReallyVisible(menuItems[i])) {
            firstVisibleMenu = menuItems[i];
            break;
        }
    }
    if (firstVisibleMenu) {
        const firstViewId = firstVisibleMenu.id.replace('-btn', '-view');
        // Afficher uniquement la vue correspondante
        const targetView = document.getElementById(firstViewId);
        if (targetView) targetView.classList.remove('hidden');
        // Forcer l'activation du bouton menu
        menuItems.forEach(item => item.classList.remove('active'));
        firstVisibleMenu.classList.add('active');
        console.log('Initial view switched to first visible menu:', firstViewId);
    } else if (menuItems.length > 0) {
        // Fallback : si aucun menu visible détecté, prendre le premier de la liste
        const fallbackViewId = menuItems[0].id.replace('-btn', '-view');
        const targetView = document.getElementById(fallbackViewId);
        if (targetView) targetView.classList.remove('hidden');
        menuItems.forEach(item => item.classList.remove('active'));
        menuItems[0].classList.add('active');
        console.warn('Aucun menu vraiment visible, fallback sur le premier :', fallbackViewId);
    } else {
        console.warn('Aucun élément de menu trouvé pour l\'initialisation de la vue.');
    }
}

// Initialisation de la sidebar
function initSidebar() {
    // TOGGLE SIDEBAR
    const menuBar = document.querySelector('#content nav .bx.bx-menu');
    const sidebar = document.getElementById('sidebar');
    
    if (menuBar && sidebar) {
        menuBar.addEventListener('click', function() {
            sidebar.classList.toggle('hide');
            const spans = sidebar.querySelectorAll('.text');
            spans.forEach(span => {
                span.style.display = sidebar.classList.contains('hide') ? 'none' : 'inline';
            });
        });
    }
}

// Initialisation de la recherche
function initSearch() {
    // Gestion de la recherche
    const searchButton = document.querySelector('#content nav form .form-input button');
    const searchButtonIcon = document.querySelector('#content nav form .form-input button .bx');
    const searchForm = document.querySelector('#content nav form');

    if (searchButton && searchButtonIcon && searchForm) {
        searchButton.addEventListener('click', function(e) {
            if(window.innerWidth < 576) {
                e.preventDefault();
                searchForm.classList.toggle('show');
                if(searchForm.classList.contains('show')) {
                    searchButtonIcon.classList.replace('bx-search', 'bx-x');
                } else {
                    searchButtonIcon.classList.replace('bx-x', 'bx-search');
                }
            }
        });
    }

    // Adaptation responsive
    if(window.innerWidth < 768) {
        const sidebar = document.getElementById('sidebar');
        if(sidebar) sidebar.classList.add('hide');
    } else if(window.innerWidth > 576) {
        if(searchButtonIcon) searchButtonIcon.classList.replace('bx-x', 'bx-search');
        if(searchForm) searchForm.classList.remove('show');
    }
}

// Gestion de la déconnexion
function initLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault(); 
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

            try {
                const response = await fetch(window.deconnexionUrl, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrfToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({}) 
                });

                const result = await response.json();
                if (response.ok) {
                    window.location.href = window.connexionUrl; 
                } else {
                    showEmployeeNotification('Erreur lors de la déconnexion : ' + result.error);
                }
            } catch (error) {
                console.error('Erreur réseau ou autre lors de la déconnexion:', error);
            }
        });
    }
}
window.DashboardCore = {
    switchView,
    isReallyVisible,
    initNavigation,
    initSidebar,
    initSearch,
    initLogout
};
