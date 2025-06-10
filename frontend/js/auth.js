// js/auth.js
import { showNotification, handleApiError } from './utils.js';

// Configuração da API
const API = 'http://localhost:3000/api';

// Configuração padrão para fetch
const fetchConfig = {
  credentials: 'include',
  mode: 'cors',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Estado de autenticação global
const authState = {
  currentUser: null,
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  sessionId: null,
  deviceInfo: null
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

// Função para atualizar tokens
const refreshTokens = async () => {
  try {
    const response = await fetch(`${API}/users/refresh`, {
      method: 'POST',
      ...fetchConfig,
      headers: {
        ...fetchConfig.headers,
        'Authorization': `Bearer ${authState.accessToken}`,
        'X-Refresh-Token': authState.refreshToken,
        'X-Session-Id': authState.sessionId,
        'User-Agent': navigator.userAgent
      }
    });

    if (!response.ok) {
      throw new Error('Falha ao atualizar tokens');
    }

    const data = await response.json();
    authState.accessToken = data.accessToken;

    // Atualizar localStorage
    const savedAuth = JSON.parse(localStorage.getItem('auth')) || {};
    savedAuth.accessToken = data.accessToken;
    localStorage.setItem('auth', JSON.stringify(savedAuth));

    return data.accessToken;
  } catch (error) {
    console.error('[Refresh Token Error]', error);
    authService.logout();
    throw error;
  }
};

// Função helper para requisições autenticadas
const fetchWithAuth = async (url, options = {}) => {
  try {
    const token = authService.getAccessToken();
    const headers = {
      ...fetchConfig.headers,
      ...options.headers,
      'User-Agent': navigator.userAgent
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (authState.refreshToken) {
      headers['X-Refresh-Token'] = authState.refreshToken;
    }

    if (authState.sessionId) {
      headers['X-Session-Id'] = authState.sessionId;
    }

    console.log(`[Fetch] ${options.method || 'GET'} ${url}`);

    const config = {
      ...fetchConfig,
      ...options,
      headers
    };

    // Para upload de arquivos, não incluir Content-Type
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    let response = await fetch(url, config);
    
    // Verificar se precisamos atualizar o access token
    if (response.status === 401 && authState.refreshToken) {
      const newAccessToken = await refreshTokens();
      
      // Tentar novamente com o novo token
      config.headers['Authorization'] = `Bearer ${newAccessToken}`;
      response = await fetch(url, config);
    }

    // Verificar header de novo access token
    const newAccessToken = response.headers.get('X-New-Access-Token');
    if (newAccessToken) {
      authState.accessToken = newAccessToken;
      const savedAuth = JSON.parse(localStorage.getItem('auth')) || {};
      savedAuth.accessToken = newAccessToken;
      localStorage.setItem('auth', JSON.stringify(savedAuth));
    }
    
    console.log(`[Response] Status: ${response.status} ${response.statusText}`);
    
    return response;
  } catch (error) {
    console.error('[Fetch Error]', error);
    throw error;
  }
};

export const authService = {
  get authState() {
    return { ...authState };
  },

  getAccessToken() {
    return authState.accessToken || JSON.parse(localStorage.getItem('auth'))?.accessToken;
  },

  getRefreshToken() {
    return authState.refreshToken || JSON.parse(localStorage.getItem('auth'))?.refreshToken;
  },

  isAuthenticated() {
    return !!this.getAccessToken();
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

      // Adicionar informações do dispositivo
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
      console.log('[Login] Resposta recebida:', { 
        hasAccessToken: !!data.accessToken,
        hasRefreshToken: !!data.refreshToken
      });
      
      if (!data.accessToken || !data.refreshToken) {
        throw new Error('Tokens não recebidos');
      }

      // Atualizar estado e localStorage
      const authData = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        sessionId: data.sessionId,
        deviceInfo: data.deviceInfo,
        user: data.user ?? data
      };

      localStorage.setItem('auth', JSON.stringify(authData));
      
      authState.accessToken = authData.accessToken;
      authState.refreshToken = authData.refreshToken;
      authState.sessionId = authData.sessionId;
      authState.deviceInfo = authData.deviceInfo;
      authState.currentUser = authData.user;
      authState.isAuthenticated = true;

      window.dispatchEvent(new Event('auth-state-changed'));
      
      const displayName = authData.user?.name || 
                         authData.user?.email || 
                         'usuário';
      
      showNotification(`Bem-vindo, ${displayName}!`, 'success');
      this.updateAuthUI();

      // Redirecionar
      const redirectTo = localStorage.getItem('redirectTo') || 'index.html';
      localStorage.removeItem('redirectTo');

      // Verificar permissão antes do redirecionamento
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
      // Tentar fazer logout no servidor
      if (this.isAuthenticated()) {
        await fetchWithAuth(`${API}/users/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
            'X-Refresh-Token': this.getRefreshToken(),
            'X-Session-Id': authState.sessionId
          }
        });
      }

      // Limpar dados locais
      localStorage.removeItem('auth');
      authState.accessToken = null;
      authState.refreshToken = null;
      authState.sessionId = null;
      authState.deviceInfo = null;
      authState.currentUser = null;
      authState.isAuthenticated = false;
      
      window.dispatchEvent(new Event('auth-state-changed'));
      
      showNotification('Logout realizado com sucesso', 'success');
      this.updateAuthUI();
      
      // Redirecionar para login
      window.location.href = 'login.html';
    } catch (error) {
      console.error('[Logout Error]', error);
      // Mesmo com erro, limpar dados locais
      this.clearAuthState();
      window.location.href = 'login.html';
    }
  },

  async initialize() {
    console.log('[Init] Inicializando sistema de autenticação...');
    
    try {
      const saved = JSON.parse(localStorage.getItem('auth'));
      console.log('[Init] Dados salvos:', { 
        hasAccessToken: !!saved?.accessToken,
        hasRefreshToken: !!saved?.refreshToken
      });

      if (!saved?.accessToken || !saved?.refreshToken) {
        this.clearAuthState();
        this.updateAuthUI();
        window.dispatchEvent(new Event('auth-initialized'));
        return;
      }

      console.log('[Init] Validando tokens...');
      const response = await fetchWithAuth(`${API}/users/me`);

      if (response.ok) {
        const apiUserData = await response.json();
        console.log('[Init] Dados do usuário recebidos');
        
        // Manter role se existir no localStorage
        if (!apiUserData.role && saved.user?.role) {
          apiUserData.role = saved.user.role;
        }
        
        authState.accessToken = saved.accessToken;
        authState.refreshToken = saved.refreshToken;
        authState.sessionId = saved.sessionId;
        authState.deviceInfo = saved.deviceInfo;
        authState.currentUser = apiUserData;
        authState.isAuthenticated = true;
        
        // Atualizar localStorage
        localStorage.setItem('auth', JSON.stringify({
          accessToken: saved.accessToken,
          refreshToken: saved.refreshToken,
          sessionId: saved.sessionId,
          deviceInfo: saved.deviceInfo,
          user: apiUserData
        }));

        console.log('[Init] Estado de autenticação atualizado');
      } else {
        console.warn('[Init] Tokens inválidos ou expirados');
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
    localStorage.removeItem('auth');
    authState.accessToken = null;
    authState.refreshToken = null;
    authState.sessionId = null;
    authState.deviceInfo = null;
    authState.currentUser = null;
    authState.isAuthenticated = false;
    
    window.dispatchEvent(new Event('auth-state-changed'));
  },

  updateAuthUI() {
    const authStatus = this.isAuthenticated() ? 'Autenticado' : 'Não autenticado';
    console.log('[UI] Atualizando interface:', authStatus);
    
    document.querySelectorAll('[data-auth]').forEach(el => {
      const authType = el.dataset.auth;
      const shouldShow = 
        (authType === 'authenticated' && this.isAuthenticated()) || 
        (authType === 'unauthenticated' && !this.isAuthenticated()) ||
        (authType === 'admin' && this.isAdmin());
      
      el.style.display = shouldShow ? '' : 'none';
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

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
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