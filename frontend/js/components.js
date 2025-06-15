// Componente de navegação reutilizável
export function renderNavbar(currentPage) {
  const navbar = document.createElement('header');
  navbar.className = 'navbar';

  navbar.innerHTML = `
    <a href="index.html" class="logo-link">
      <div class="logo-container">
        <div class="logo-icon">
          <div class="logo-circles">
            <div class="logo-circle orange"></div>
            <div class="logo-circle green"></div>
            <div class="logo-circle blue"></div>
          </div>
        </div>
        <h1 class="logo-text">CineLog</h1>
      </div>
    </a>
    <nav>
      <a href="index.html" class="${currentPage === 'home' ? 'active' : ''}">Início</a>
      <a href="add.html" data-auth="authenticated" style="display:none" class="${currentPage === 'add' ? 'active' : ''}">Adicionar Filme</a>
      <a href="profile.html" data-auth="authenticated" style="display:none" class="${currentPage === 'profile' ? 'active' : ''}">Perfil</a>
      <a href="admin.html" data-auth="admin" style="display:none" class="${currentPage === 'admin' ? 'active' : ''}">Administração</a>
      <a href="#" id="logout-link" data-auth="authenticated" style="display:none">Sair</a>
      <a href="login.html" data-auth="unauthenticated" style="display:none" class="${currentPage === 'login' ? 'active' : ''}">Login</a>
      <a href="register.html" data-auth="unauthenticated" style="display:none" class="${currentPage === 'register' ? 'active' : ''}">Cadastrar</a>
    </nav>
  `;
  return navbar;
}

export function initializeNavbar() {
  // Remove navbar duplicada se houver (garantia)
  document.querySelectorAll('header.navbar').forEach((el, i) => { if(i > 0) el.remove(); });
  if (document.querySelector('header.navbar')) return;

  console.log('[Navbar] Inicializando navbar...');

  const path = window.location.pathname;
  let currentPage = 'home';

  if (path.includes('movie-detail.html')) {
    currentPage = 'detail';
    document.body.classList.add('movie-detail-page');
  }
  else if (path.includes('add.html')) currentPage = 'add';
  else if (path.includes('edit.html')) currentPage = 'edit';
  else if (path.includes('profile.html')) currentPage = 'profile';
  else if (path.includes('admin.html')) currentPage = 'admin';
  else if (path.includes('login.html')) {
    currentPage = 'login';
    document.body.classList.add('login-page');
  }
  else if (path.includes('register.html')) {
    currentPage = 'register';
    document.body.classList.add('register-page');
  }

  const navbar = renderNavbar(currentPage);
  document.body.prepend(navbar);

  // Logout event
  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      import('./auth.js').then(module => {
        module.authService.logout();
      });
    });
  }

  // AGUARDAR authService estar disponível e inicializado
  import('./auth.js').then(module => {
    const authService = module.authService;
    
    // Função para atualizar UI da navbar
    const updateNavbarUI = () => {
      console.log('[Navbar] Atualizando UI da navbar');
      console.log('[Navbar] Estado auth:', {
        isAuthenticated: authService.isAuthenticated(),
        isAdmin: authService.isAdmin(),
        user: authService.authState.currentUser
      });
      
      // Forçar atualização da UI
      authService.updateAuthUI();
    };

    // Aguardar inicialização completa
    if (authService.authState.isAuthenticated !== undefined) {
      // Já inicializado
      setTimeout(updateNavbarUI, 100);
    } else {
      // Aguardar eventos de inicialização
      window.addEventListener('auth-initialized', updateNavbarUI);
    }
    
    // Sempre escutar mudanças de estado
    window.addEventListener('auth-state-changed', updateNavbarUI);
  });

  console.log('[Navbar] ✅ Navbar inicializada');
}