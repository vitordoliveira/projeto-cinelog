import { showNotification, handleApiError } from './utils.js';

// Configuração da API
const API = 'http://localhost:3000/api';

// Configuração padrão para fetch - IMPORTANTE: credentials: 'include' para cookies
const fetchConfig = {
  credentials: 'include', // Essencial para cookies HttpOnly
  mode: 'cors',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Estado de autenticação global - SEM TOKENS SENSÍVEIS
const authState = {
  currentUser: null,
  isAuthenticated: false,
  sessionId: null,
  deviceInfo: null
  // accessToken e refreshToken removidos - agora estão em cookies HttpOnly
};

// Função para obter informações do dispositivo
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  const browser = (function() {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('MSIE') || ua.includes('Trident/')) return 'Internet Explorer';
    return 'Unknown Browser';
  })();

  const os = (function() {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac OS')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown OS';
  })();

  return `${browser} em ${os}`;
};

// Función para obtener sessionId do cookie (não é httpOnly)
const getSessionIdFromCookie = () => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'sessionId') {
      return parseInt(value);
    }
  }
  return null;
};

// Função para aguardar com delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função helper para requisições autenticadas - COM RETRY
const fetchWithAuth = async (url, options = {}) => {
  const maxRetries = 3;
  const baseDelay = 500; // 500ms base
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const headers = {
        ...fetchConfig.headers,
        ...options.headers,
        'User-Agent': navigator.userAgent
      };

      console.log(`[Fetch] Tentativa ${attempt}/${maxRetries} - ${options.method || 'GET'} ${url}`);

      const config = {
        ...fetchConfig, // Já inclui credentials: 'include'
        ...options,
        headers
      };

      // Para upload de arquivos, não incluir Content-Type
      if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
      }

      const response = await fetch(url, config);
      
      console.log(`[Response] Status: ${response.status} ${response.statusText}`);
      
      return response;
    } catch (error) {
      console.error(`[Fetch Error] Tentativa ${attempt}/${maxRetries}:`, error.message);
      
      // Se for a última tentativa, lançar o erro
      if (attempt === maxRetries) {
        console.error('[Fetch] Todas as tentativas falharam');
        throw error;
      }
      
      // Aguardar antes da próxima tentativa (backoff exponencial)
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`[Fetch] Aguardando ${delay}ms antes da próxima tentativa...`);
      await sleep(delay);
    }
  }
};

export const authService = {
  get authState() {
    return { ...authState };
  },

  // Métodos simplificados - tokens estão em cookies
  getSessionId() {
    return authState.sessionId || getSessionIdFromCookie();
  },

  isAuthenticated() {
    return authState.isAuthenticated;
  },

  isAdmin() {
    return authState.currentUser?.role === 'ADMIN';
  },

  async register(userData) {
    try {
      userData.deviceInfo = getDeviceInfo();
      
      const res = await fetchWithAuth(`${API}/users/register`, {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro no registro');
      }

      showNotification('Cadastro realizado com sucesso!', 'success');
      setTimeout(() => window.location.href = 'login.html', 2000);
      return true;
    } catch (err) {
      console.error('[Register Error]', err);
      showNotification(err.message || 'Erro no registro', 'error');
      throw err;
    }
  },

  async login(credentials) {
    try {
      console.log('[Login] Iniciando processo de login...');

      credentials.deviceInfo = getDeviceInfo();

      const response = await fetchWithAuth(`${API}/users/login`, {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Credenciais inválidas');
      }

      const data = await response.json();
      console.log('[Login] Resposta recebida:', data);
      
      // Verificar se o login foi bem-sucedido
      if (!data.success || !data.user) {
        throw new Error('Dados de login incompletos');
      }

      // ATUALIZAR APENAS DADOS NÃO SENSÍVEIS
      const userData = {
        user: data.user,
        sessionId: data.sessionId
      };

      // Salvar apenas dados não sensíveis no localStorage
      localStorage.setItem('user_data', JSON.stringify(userData));
      
      // Atualizar estado
      authState.currentUser = data.user;
      authState.sessionId = data.sessionId;
      authState.isAuthenticated = true;
      authState.deviceInfo = credentials.deviceInfo;

      window.dispatchEvent(new Event('auth-state-changed'));
      
      const displayName = data.user?.name || data.user?.email || 'usuário';
      
      showNotification(`Bem-vindo, ${displayName}!`, 'success');
      this.updateAuthUI();

      // Redirecionar
      const redirectTo = localStorage.getItem('redirectTo') || 'index.html';
      localStorage.removeItem('redirectTo');

      if (redirectTo.includes('admin.html') && !this.isAdmin()) {
        window.location.href = 'index.html';
        showNotification('Acesso restrito', 'warning');
      } else {
        window.location.href = redirectTo;
      }

      return true;
    } catch (error) {
      console.error('[Login Error]', error);
      showNotification(error.message || 'Erro no login', 'error');
      throw error;
    }
  },

  async logout() {
    try {
      console.log('[Logout] Iniciando logout...');
      
      // Chamar endpoint de logout para limpar cookies no servidor
      try {
        await fetchWithAuth(`${API}/users/logout`, {
          method: 'POST'
        });
      } catch (e) {
        console.warn('[Logout] Erro ao chamar endpoint:', e);
        // Continuar com limpeza local mesmo se falhar
      }

      // Limpeza local
      localStorage.removeItem('user_data');
      localStorage.removeItem('auth'); // Remover dados antigos se existirem
      
      authState.currentUser = null;
      authState.sessionId = null;
      authState.deviceInfo = null;
      authState.isAuthenticated = false;

      window.dispatchEvent(new Event('auth-state-changed'));
      showNotification('Logout realizado com sucesso', 'success');
      this.updateAuthUI();
      window.location.href = 'login.html';
    } catch (error) {
      console.error('[Logout Error]', error);
      this.clearAuthState();
      window.location.href = 'login.html';
    }
  },

  async initialize() {
    console.log('[Init] Inicializando sistema de autenticação...');
    
    try {
      // Tentar recuperar dados salvos (não sensíveis)
      const saved = JSON.parse(localStorage.getItem('user_data') || '{}');
      
      // Migrar dados antigos se existirem
      const oldAuth = JSON.parse(localStorage.getItem('auth') || '{}');
      if (oldAuth.user && !saved.user) {
        console.log('[Init] Migrando dados antigos...');
        localStorage.setItem('user_data', JSON.stringify({
          user: oldAuth.user,
          sessionId: oldAuth.sessionId
        }));
        localStorage.removeItem('auth'); // Remover dados antigos
      }

      console.log('[Init] Verificando autenticação via API...');
      
      // NOVO: Verificar se ainda está autenticado com retry
      let response;
      let lastError;
      
      try {
        response = await fetchWithAuth(`${API}/users/me`);
      } catch (error) {
        lastError = error;
        console.warn('[Init] Falha na verificação de autenticação:', error.message);
        
        // Se falhou completamente, tratar como não autenticado
        console.warn('[Init] ❌ Erro de conexão - assumindo não autenticado');
        this.clearAuthState();
        this.updateAuthUI();
        window.dispatchEvent(new Event('auth-initialized'));
        return;
      }

      if (response && response.ok) {
        const apiUserData = await response.json();
        console.log('[Init] ✅ Usuário autenticado:', apiUserData.email);
        
        authState.currentUser = apiUserData;
        authState.sessionId = saved.sessionId || getSessionIdFromCookie();
        authState.isAuthenticated = true;
        
        // Atualizar dados salvos
        localStorage.setItem('user_data', JSON.stringify({
          user: apiUserData,
          sessionId: authState.sessionId
        }));

        console.log('[Init] Estado de autenticação atualizado');
      } else {
        console.warn('[Init] ❌ Não autenticado ou sessão expirada');
        this.clearAuthState();
      }

      this.updateAuthUI();
      window.dispatchEvent(new Event('auth-initialized'));
    } catch (error) {
      console.error('[Init Error]', error);
      this.clearAuthState();
      this.updateAuthUI();
      window.dispatchEvent(new Event('auth-initialized'));
    }
  },

  clearAuthState() {
    localStorage.removeItem('user_data');
    localStorage.removeItem('auth'); // Limpar dados antigos também
    authState.currentUser = null;
    authState.sessionId = null;
    authState.deviceInfo = null;
    authState.isAuthenticated = false;
    
    window.dispatchEvent(new Event('auth-state-changed'));
  },

  updateAuthUI() {
    const authStatus = this.isAuthenticated() ? 'Autenticado' : 'Não autenticado';
    console.log('[UI] Atualizando interface:', authStatus);

    // Esconde tudo por padrão, mostra só depois da checagem
    document.querySelectorAll('[data-auth]').forEach(el => {
      el.style.display = 'none';
    });

    document.querySelectorAll('[data-auth]').forEach(el => {
      const authType = el.dataset.auth;
      let shouldShow = false;
      if (authType === 'authenticated' && this.isAuthenticated()) shouldShow = true;
      if (authType === 'unauthenticated' && !this.isAuthenticated()) shouldShow = true;
      if (authType === 'admin' && this.isAdmin()) shouldShow = true;
      if (shouldShow) {
        el.style.display = '';
      }
    });

    document.querySelectorAll('[data-user]').forEach(el => {
      const field = el.dataset.user;
      el.textContent = authState.currentUser?.[field] || '';
    });

    document.body.classList.toggle('authenticated', this.isAuthenticated());
    document.body.classList.toggle('unauthenticated', !this.isAuthenticated());
    document.body.classList.toggle('admin', this.isAdmin());
  },

  // Métodos de gerenciamento de sessões
  async getSessions() {
    if (!this.isAuthenticated()) return [];
    
    try {
      const response = await fetchWithAuth(`${API}/users/sessions`);
      if (!response.ok) throw new Error('Falha ao buscar sessões');
      
      const sessions = await response.json();
      return sessions.map(session => ({
        ...session,
        isCurrentSession: session.id === authState.sessionId
      }));
    } catch (error) {
      console.error('[Get Sessions Error]', error);
      return [];
    }
  },

  async terminateSession(sessionId) {
    if (!this.isAuthenticated()) return false;
    
    try {
      const response = await fetchWithAuth(`${API}/users/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Falha ao encerrar sessão');
      
      // Se a sessão encerrada for a atual, fazer logout
      if (sessionId === authState.sessionId) {
        await this.logout();
      }
      
      return true;
    } catch (error) {
      console.error('[Terminate Session Error]', error);
      return false;
    }
  },

  async terminateAllSessions() {
    if (!this.isAuthenticated()) return false;
    
    try {
      const response = await fetchWithAuth(`${API}/users/logout-all`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Falha ao encerrar todas as sessões');
      
      // Fazer logout local após encerrar todas as sessões
      await this.logout();
      return true;
    } catch (error) {
      console.error('[Terminate All Sessions Error]', error);
      return false;
    }
  }
};

// Inicialização CONDICIONAL - respeita flag data-skip-auth-init
document.addEventListener('DOMContentLoaded', () => {
  // VERIFICAR SE DEVE PULAR INICIALIZAÇÃO AUTOMÁTICA
  if (document.body.hasAttribute('data-skip-auth-init')) {
    console.log('[Init] ⏭️ Inicialização automática pulada (data-skip-auth-init)');
    return;
  }
  
  console.log('[Init] Inicializando auth.js...');
  
  if (!document.getElementById('notification-container')) {
    const nc = document.createElement('div');
    nc.id = 'notification-container';
    document.body.prepend(nc);
  }

  authService.initialize().catch(error => {
    console.error('[Init Error]', error);
    authService.clearAuthState();
  });
});