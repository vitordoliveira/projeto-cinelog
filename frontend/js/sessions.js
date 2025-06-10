// js/sessions.js
import { authService } from './auth.js';
import { showNotification } from './utils.js';
import { sessionService } from './main.js';

class SessionsManager {
    constructor() {
        this.sessionsContainer = document.getElementById('sessions-list');
        this.terminateAllBtn = document.getElementById('terminate-all');
        this.currentSessionId = authService.authState.sessionId;
        this.isLoading = false;

        this.init();
    }

    async init() {
        // Aguardar inicialização do auth service
        await new Promise(resolve => {
            if (window.navbarInitialized) {
                resolve();
            } else {
                window.addEventListener('auth-initialized', () => resolve(), { once: true });
            }
        });

        if (!authService.isAuthenticated()) {
            localStorage.setItem('redirectTo', 'sessions.html');
            window.location.href = 'login.html';
            return;
        }

        this.setupEventListeners();
        await this.loadSessions();
    }

    setupEventListeners() {
        this.terminateAllBtn?.addEventListener('click', () => this.handleTerminateAll());

        // Atualizar sessões quando houver mudança no estado de autenticação
        window.addEventListener('auth-state-changed', () => {
            if (!authService.isAuthenticated()) {
                window.location.href = 'login.html';
            }
        });
    }

    async loadSessions() {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            this.sessionsContainer.innerHTML = '<div class="loading">Carregando sessões...</div>';
            
            const sessions = await sessionService.getSessions();
            
            if (!Array.isArray(sessions) || sessions.length === 0) {
                this.sessionsContainer.innerHTML = `
                    <div class="no-sessions">
                        <i class="fas fa-laptop"></i>
                        <p>Nenhuma sessão ativa encontrada.</p>
                    </div>
                `;
                return;
            }

            this.sessionsContainer.innerHTML = sessions
                .sort((a, b) => {
                    // Colocar sessão atual primeiro
                    if (a.id === this.currentSessionId) return -1;
                    if (b.id === this.currentSessionId) return 1;
                    // Depois ordenar por última atividade
                    return new Date(b.lastActivity) - new Date(a.lastActivity);
                })
                .map(session => this.createSessionCard(session))
                .join('');

        } catch (error) {
            console.error('Erro ao carregar sessões:', error);
            this.sessionsContainer.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao carregar sessões. Por favor, tente novamente.</p>
                </div>
            `;
            showNotification('Erro ao carregar sessões', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    createSessionCard(session) {
        const isCurrentSession = session.id === this.currentSessionId;
        const lastActivity = new Date(session.lastActivity).toLocaleString();
        const createdAt = new Date(session.createdAt).toLocaleString();

        const deviceIcon = this.getDeviceIcon(session.deviceInfo);

        return `
            <div class="session-card ${isCurrentSession ? 'current-session' : ''}">
                <div class="session-info">
                    <div class="session-device">
                        <i class="${deviceIcon}"></i>
                        ${session.deviceInfo}
                        ${isCurrentSession ? ' (Sessão Atual)' : ''}
                    </div>
                    <div class="session-details">
                        <div><i class="fas fa-network-wired"></i> IP: ${session.ipAddress || 'Não disponível'}</div>
                        <div><i class="fas fa-clock"></i> Última atividade: ${lastActivity}</div>
                        <div><i class="fas fa-calendar-alt"></i> Iniciada em: ${createdAt}</div>
                    </div>
                </div>
                <div class="session-actions">
                    ${isCurrentSession ? '' : `
                        <button 
                            class="terminate-btn"
                            onclick="sessionManager.handleTerminateSession(${session.id})"
                        >
                            <i class="fas fa-times"></i> Encerrar
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    getDeviceIcon(deviceInfo) {
        const deviceInfo_lower = deviceInfo.toLowerCase();
        if (deviceInfo_lower.includes('android')) return 'fas fa-mobile-alt';
        if (deviceInfo_lower.includes('iphone') || deviceInfo_lower.includes('ios')) return 'fas fa-mobile-alt';
        if (deviceInfo_lower.includes('ipad')) return 'fas fa-tablet-alt';
        if (deviceInfo_lower.includes('windows')) return 'fab fa-windows';
        if (deviceInfo_lower.includes('mac')) return 'fab fa-apple';
        if (deviceInfo_lower.includes('linux')) return 'fab fa-linux';
        return 'fas fa-laptop';
    }

    async handleTerminateSession(sessionId) {
        if (this.isLoading) return;
        
        try {
            const success = await sessionService.terminateSession(sessionId);
            
            if (success) {
                if (sessionId === this.currentSessionId) {
                    // Será redirecionado pelo authService.logout()
                    return;
                }
                await this.loadSessions();
            }
        } catch (error) {
            console.error('Erro ao encerrar sessão:', error);
            showNotification('Erro ao encerrar sessão', 'error');
        }
    }

    async handleTerminateAll() {
        if (this.isLoading) return;
        
        if (!confirm('Tem certeza que deseja encerrar todas as sessões? Você precisará fazer login novamente.')) {
            return;
        }

        try {
            await sessionService.terminateAllSessions();
            // O authService.logout() será chamado pelo sessionService e redirecionará
        } catch (error) {
            console.error('Erro ao encerrar todas as sessões:', error);
            showNotification('Erro ao encerrar sessões', 'error');
        }
    }
}

// Inicializar o gerenciador de sessões quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.sessionManager = new SessionsManager();
});