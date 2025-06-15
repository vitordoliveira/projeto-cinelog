import { authService } from './auth.js';
import { showNotification, handleApiError, formatDate, starRating } from './utils.js';
import { initializeNavbar } from './components.js';
import { sessionService } from './main.js';

const API = 'http://localhost:3000/api';

// Função helper para requisições autenticadas (igual ao auth.js)
const fetchWithAuth = async (url, options = {}) => {
    const config = {
        credentials: 'include', // Essencial para cookies HttpOnly
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': navigator.userAgent,
            ...options.headers
        },
        ...options
    };

    // Para upload de arquivos, não incluir Content-Type
    if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    return fetch(url, config);
};

// Inicializa o serviço de perfil
const profileService = {
    // Busca dados do usuário atual
    async fetchUserData() {
        try {
            if (!authService.isAuthenticated()) {
                window.location.href = 'login.html';
                return null;
            }

            const response = await fetchWithAuth(`${API}/users/me`);

            if (!response.ok) {
                console.error('Erro ao buscar dados de usuário:', response.status);
                if (response.status === 401) {
                    authService.clearAuthState();
                    window.location.href = 'login.html';
                    return null;
                }
                
                showNotification('Erro ao carregar dados do usuário', 'error');
                return null;
            }

            const userData = await response.json();
            console.log("Dados brutos do usuário:", userData);
            return userData;
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            showNotification('Falha ao carregar seus dados', 'error');
            return null;
        }
    },

    // Atualiza perfil do usuário
    async updateProfile(userData) {
        try {
            if (!authService.isAuthenticated()) {
                window.location.href = 'login.html';
                return null;
            }

            const currentUser = authService.authState.currentUser;
            if (!currentUser || !currentUser.id) {
                showNotification('Dados de usuário não disponíveis', 'error');
                return null;
            }

            const response = await fetchWithAuth(`${API}/users/${currentUser.id}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                if (response.status === 401) {
                    authService.clearAuthState();
                    window.location.href = 'login.html';
                    return null;
                }
                
                const errorData = await response.json();
                showNotification(errorData.error || 'Erro ao atualizar perfil', 'error');
                return null;
            }

            showNotification('Perfil atualizado com sucesso!', 'success');
            return await response.json();
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            showNotification('Falha ao atualizar perfil', 'error');
            return null;
        }
    },

    // Busca as avaliações feitas pelo usuário
    async fetchUserReviews() {
        try {
            if (!authService.isAuthenticated()) return [];

            const response = await fetchWithAuth(`${API}/users/me/reviews`);

            if (!response.ok) {
                console.warn('Erro ao buscar avaliações:', response.status);
                return [];
            }

            const reviews = await response.json();
            console.log("Avaliações brutas recebidas:", reviews);
            return reviews;
        } catch (error) {
            console.error('Erro ao buscar avaliações do usuário:', error);
            return [];
        }
    },
    
    // Busca os filmes adicionados pelo usuário
    async fetchUserMovies() {
        try {
            if (!authService.isAuthenticated()) return [];

            const response = await fetchWithAuth(`${API}/users/me/movies`);

            if (!response.ok) {
                console.warn('Erro ao buscar filmes do usuário:', response.status);
                if (response.status === 404) {
                    return mockUserMovies();
                }
                return [];
            }

            const movies = await response.json();
            console.log("Filmes brutos recebidos:", movies);
            return movies;
        } catch (error) {
            console.error('Erro ao buscar filmes do usuário:', error);
            return [];
        }
    },
    
    // Upload de avatar
    async uploadAvatar(formData) {
        try {
            if (!authService.isAuthenticated()) {
                window.location.href = 'login.html';
                return null;
            }

            const currentUser = authService.authState.currentUser;
            if (!currentUser || !currentUser.id) {
                showNotification('Dados de usuário não disponíveis', 'error');
                return null;
            }

            const response = await fetchWithAuth(`${API}/users/${currentUser.id}/avatar`, {
                method: 'POST',
                body: formData
            });

            // Trata a resposta
            const data = await response.json();
                
            if (response.ok) {
                showNotification('Foto de perfil atualizada com sucesso!', 'success');
                return data;
            }
            
            // Se houver erro, tenta gerar avatar
            if (response.status === 404) {
                console.log('Endpoint de upload não disponível, tentando gerar avatar por nome...');
                return await this.generateAvatar();
            }
            
            // Trata outros erros
            console.warn('Erro ao fazer upload de avatar:', response.status);
            showNotification(data.error || 'Não foi possível atualizar sua foto de perfil', 'error');
            return null;

        } catch (error) {
            console.error('Erro ao fazer upload de avatar:', error);
            showNotification('Falha ao atualizar foto de perfil', 'error');
            return null;
        }
    },
    
    // Método alternativo - gerar avatar baseado no nome
    async generateAvatar() {
        try {
            if (!authService.isAuthenticated()) {
                window.location.href = 'login.html';
                return null;
            }

            const currentUser = authService.authState.currentUser;
            if (!currentUser || !currentUser.id) {
                showNotification('Dados de usuário não disponíveis', 'error');
                return null;
            }

            const response = await fetchWithAuth(`${API}/users/${currentUser.id}/avatar/generate`, {
                method: 'POST'
            });

            if (!response.ok) {
                if (response.status === 404) {
                    showNotification('Gerando avatar localmente...', 'info');
                    console.log('Gerando avatar localmente (backend não implementado)');
                    
                    const user = authService.authState.currentUser;
                    const mockAvatarUrl = 'https://ui-avatars.com/api/?name=' + 
                        encodeURIComponent(user.name) + '&background=2c3440&color=fff&size=200';
                    
                    return {
                        user: {
                            ...user,
                            avatarUrl: mockAvatarUrl
                        }
                    };
                }
                
                console.warn('Erro ao gerar avatar:', response.status);
                showNotification('Não foi possível gerar seu avatar', 'error');
                return null;
            }

            showNotification('Avatar gerado com sucesso!', 'success');
            return await response.json();
        } catch (error) {
            console.error('Erro ao gerar avatar:', error);
            showNotification('Falha ao gerar avatar', 'error');
            return null;
        }
    },

    // Funções de sessão
    async fetchUserSessions() {
        try {
            return await authService.getSessions();
        } catch (error) {
            console.error('Erro ao buscar sessões:', error);
            return [];
        }
    },

    async terminateSession(sessionId) {
        try {
            return await authService.terminateSession(sessionId);
        } catch (error) {
            console.error('Erro ao encerrar sessão:', error);
            return false;
        }
    },

    async terminateAllSessions() {
        try {
            return await authService.terminateAllSessions();
        } catch (error) {
            console.error('Erro ao encerrar todas as sessões:', error);
            return false;
        }
    }
};

// Função para gerar iniciais a partir do nome
function getInitials(name) {
    if (!name) return '?';
    
    const words = name.split(' ').filter(word => word.length > 0);
    
    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    } else {
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
}

// Função para preencher informações do usuário
function populateProfileInfo(userData) {
    if (!userData) return;
    
    console.log("Populando informações do usuário:", userData);
    
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = userData.name || 'Usuário';
    }
    
    const userEmailElement = document.getElementById('user-email');
    if (userEmailElement) {
        userEmailElement.textContent = userData.email || '';
    }
    
    const userSinceElement = document.getElementById('user-since');
    if (userSinceElement && userData.createdAt) {
        console.log("Data de criação original:", userData.createdAt);
        
        const formattedDate = formatDate(userData.createdAt);
        console.log("Data formatada:", formattedDate);
        
        userSinceElement.textContent = formattedDate;
    } else if (userSinceElement) {
        userSinceElement.textContent = 'Data indisponível';
    }
    
    updateUserAvatar(userData);
    
    document.getElementById('name').value = userData.name || '';
    document.getElementById('email').value = userData.email || '';
}

// Função para atualizar o avatar do usuário
function updateUserAvatar(userData) {
    const avatarElement = document.getElementById('user-avatar');
    if (!avatarElement) return;
    
    avatarElement.innerHTML = '';
    
    if (userData.avatarUrl) {
        const img = document.createElement('img');
        
        if (userData.avatarUrl.startsWith('http')) {
            img.src = userData.avatarUrl;
        } else {
            img.src = API + userData.avatarUrl;
        }
        
        console.log('Carregando avatar de:', img.src);
        
        img.onload = () => console.log('Avatar carregado com sucesso!');
        img.onerror = (e) => {
            console.error('Erro ao carregar avatar:', e);
            avatarElement.textContent = getInitials(userData.name);
        };
        
        img.alt = userData.name || 'Avatar';
        img.className = 'avatar-image';
        avatarElement.appendChild(img);
    } else {
        avatarElement.textContent = getInitials(userData.name);
    }
}

// Função para renderizar as avaliações do usuário (NOVA VERSÃO VERTICAL)
function renderUserReviews(reviews) {
    const container = document.getElementById('user-reviews');
    const emptyState = document.getElementById('empty-reviews');
    
    if (!container || !emptyState) return;
    
    if (!reviews || reviews.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    
    reviews.forEach(review => {
        console.log(`Review para "${review.movie?.title}": Data criação original = ${review.createdAt}`);
    });
    
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    container.innerHTML = reviews.map(review => {
        const movie = review.movie || { id: 0, title: 'Filme indisponível', imageUrl: '', releaseYear: '' };
        
        return `
            <div class="letterboxd-review-item">
                <div class="review-poster-container" onclick="window.location.href='movie-detail.html?id=${movie.id}'">
                    <img src="${movie.imageUrl || 'images/placeholder.jpg'}" 
                         alt="${movie.title}" 
                         class="review-poster">
                </div>
                
                <div class="review-details">
                    <div class="review-movie-header">
                        <h3 class="review-movie-title" onclick="window.location.href='movie-detail.html?id=${movie.id}'">${movie.title}</h3>
                        <span class="review-movie-year">${movie.releaseYear || ''}</span>
                    </div>
                    
                    <div class="review-rating-line">
                        <div class="review-stars">${starRating(review.rating)}</div>
                        <span class="review-date">Avaliado em ${formatDate(review.createdAt)}</span>
                    </div>
                    
                    ${review.comment ? `<div class="review-comment">${review.comment}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Função para renderizar os filmes do usuário
function renderUserMovies(movies) {
    const container = document.getElementById('user-movies');
    const emptyState = document.getElementById('empty-movies');
    
    if (!container || !emptyState) return;
    
    if (!movies || movies.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    
    movies.sort((a, b) => b.id - a.id);
    
    container.innerHTML = movies.map(movie => {
        return `
            <div class="movie-card">
                ${movie.imageUrl 
                    ? `<img src="${movie.imageUrl}" alt="${movie.title}" class="movie-poster">`
                    : `<div class="movie-poster placeholder"><i class="fas fa-film" style="font-size:48px;color:#89a"></i></div>`
                }
                <a href="movie-detail.html?id=${movie.id}" class="movie-link" aria-label="Ver detalhes de ${movie.title}"></a>
            </div>
        `;
    }).join('');
    
    const styleTag = document.createElement('style');
    styleTag.textContent = `
        #user-movies {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        #user-movies .movie-card {
            position: relative;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
            cursor: pointer;
            aspect-ratio: 2/3;
        }
        
        #user-movies .movie-card:hover {
            transform: translateY(-5px);
        }
        
        #user-movies .movie-poster {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        #user-movies .placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f0f0f0;
            height: 100%;
        }
        
        #user-movies .movie-link {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
    `;
    document.head.appendChild(styleTag);
    
    document.querySelectorAll('.movie-card').forEach(card => {
        card.addEventListener('click', function() {
            const link = this.querySelector('.movie-link');
            if (link) window.location.href = link.href;
        });
    });
}

// Função para renderizar as sessões do usuário
function renderUserSessions(sessions) {
    const container = document.getElementById('sessions-list');
    if (!container) return;
    
    if (!sessions || sessions.length === 0) {
        container.innerHTML = `
            <div class="no-sessions">
                <i class="fas fa-laptop"></i>
                <p>Nenhuma sessão ativa encontrada.</p>
            </div>
        `;
        return;
    }

    const currentSessionId = authService.authState.sessionId;
    
    container.innerHTML = sessions
        .sort((a, b) => {
            if (a.id === currentSessionId) return -1;
            if (b.id === currentSessionId) return 1;
            return new Date(b.lastActivity) - new Date(a.lastActivity);
        })
        .map(session => {
            const isCurrentSession = session.id === currentSessionId;
            const lastActivity = new Date(session.lastActivity).toLocaleString();
            const createdAt = new Date(session.createdAt).toLocaleString();
            const deviceIcon = getDeviceIcon(session.deviceInfo);

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
                    ${!isCurrentSession ? `
                        <div class="session-actions">
                            <button class="terminate-btn" onclick="terminateSession('${session.id}')">
                                <i class="fas fa-times"></i> Encerrar
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

    // Adicionar o manipulador de eventos globalmente
    window.terminateSession = async (sessionId) => {
        if (confirm('Tem certeza que deseja encerrar esta sessão?')) {
            const success = await authService.terminateSession(sessionId);
            if (success) {
                const sessions = await authService.getSessions();
                renderUserSessions(sessions);
            }
        }
    };
}

// Função auxiliar para determinar o ícone do dispositivo
function getDeviceIcon(deviceInfo) {
    const deviceInfo_lower = deviceInfo.toLowerCase();
    if (deviceInfo_lower.includes('android')) return 'fas fa-mobile-alt';
    if (deviceInfo_lower.includes('iphone') || deviceInfo_lower.includes('ios')) return 'fas fa-mobile-alt';
    if (deviceInfo_lower.includes('ipad')) return 'fas fa-tablet-alt';
    if (deviceInfo_lower.includes('windows')) return 'fab fa-windows';
    if (deviceInfo_lower.includes('mac')) return 'fab fa-apple';
    if (deviceInfo_lower.includes('linux')) return 'fab fa-linux';
    return 'fas fa-laptop';
}

// Função para calcular estatísticas do usuário
function updateUserStats(reviews, movies) {
    const totalReviewsElement = document.getElementById('total-reviews');
    const totalMoviesElement = document.getElementById('total-movies');
    const averageRatingElement = document.getElementById('average-rating');
    
    if (totalReviewsElement) {
        totalReviewsElement.textContent = reviews?.length || '0';
    }
    
    if (totalMoviesElement) {
        totalMoviesElement.textContent = movies?.length || '0';
    }
    
    if (averageRatingElement) {
        if (!reviews || reviews.length === 0) {
            averageRatingElement.textContent = '0.0';
        } else {
            const totalRating = reviews.reduce((sum, review) => sum + Number(review.rating), 0);
            const averageRating = (totalRating / reviews.length).toFixed(1);
            averageRatingElement.textContent = averageRating;
        }
    }
}

// Configurar navegação por abas
function setupTabs() {
    const tabs = document.querySelectorAll('.profile-tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            
            const tabName = tab.getAttribute('data-tab');
            document.getElementById(`${tabName}-content`).classList.add('active');
        });
    });
}

// Configurar botão de editar perfil
function setupProfileButtons() {
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const editProfileSection = document.getElementById('edit-profile-section');
    
    if (editProfileBtn && saveProfileBtn && editProfileSection) {
        editProfileBtn.addEventListener('click', () => {
            editProfileSection.style.display = 'block';
            editProfileBtn.style.display = 'none';
            saveProfileBtn.style.display = 'inline-block';
        });
        
        saveProfileBtn.addEventListener('click', async () => {
            const name = document.getElementById('name').value.trim();
            const password = document.getElementById('password').value.trim();
            const confirmPassword = document.getElementById('confirmPassword').value.trim();
            
            if (!name) {
                showNotification('O nome não pode estar vazio', 'error');
                return;
            }
            
            if (password && password !== confirmPassword) {
                showNotification('As senhas não coincidem', 'error');
                return;
            }
            
            const updateData = { name };
            if (password) {
                updateData.password = password;
            }
            
            showNotification('Atualizando seu perfil...', 'info', 2000);
            
            try {
                const result = await profileService.updateProfile(updateData);
                
                if (result) {
                    editProfileSection.style.display = 'none';
                    saveProfileBtn.style.display = 'none';
                    editProfileBtn.style.display = 'inline-block';
                    
                    document.getElementById('password').value = '';
                    document.getElementById('confirmPassword').value = '';
                    
                    await authService.initialize();
                    
                    populateProfileInfo(result.user || authService.authState.currentUser);
                }
            } catch (error) {
                console.error('Erro ao atualizar perfil:', error);
                showNotification('Falha ao processar atualização', 'error');
            }
        });
    }
}

// Configurar upload de foto de perfil
function setupAvatarUpload() {
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    const avatarUploadInput = document.getElementById('avatar-upload');
    const generateAvatarBtn = document.getElementById('generate-avatar-btn');
    
    if (changeAvatarBtn && avatarUploadInput) {
        changeAvatarBtn.addEventListener('click', () => {
            avatarUploadInput.click();
        });
        
        avatarUploadInput.addEventListener('change', async (event) => {
            if (event.target.files && event.target.files[0]) {
                showNotification('Enviando imagem...', 'info', 3000);
                
                const formData = new FormData();
                formData.append('avatar', event.target.files[0]);
                
                try {
                    const result = await profileService.uploadAvatar(formData);
                    
                    if (result) {
                        updateUserAvatar(result.user);
                        avatarUploadInput.value = '';
                    }
                } catch (error) {
                    console.error('Erro ao fazer upload de avatar:', error);
                    showNotification('Erro ao enviar imagem', 'error');
                }
            }
        });
    }
    
    if (generateAvatarBtn) {
        generateAvatarBtn.addEventListener('click', async () => {
            showNotification('Gerando avatar...', 'info', 3000);
            
            try {
                const result = await profileService.generateAvatar();
                
                if (result) {
                    updateUserAvatar(result.user);
                }
            } catch (error) {
                console.error('Erro ao gerar avatar:', error);
                showNotification('Erro ao gerar avatar', 'error');
            }
        });
    }
}

// Configurar botão de adicionar filme
function setupAddMovieButton() {
    const addMovieBtn = document.querySelector('.add-movie-btn');
    
    if (addMovieBtn) {
        addMovieBtn.addEventListener('click', () => {
            window.location.href = 'add.html';
        });
    }
}

// Configurar gerenciamento de sessões
function setupSessionManagement() {
    const terminateAllBtn = document.getElementById('terminate-all');
    if (terminateAllBtn) {
        terminateAllBtn.addEventListener('click', async () => {
            if (confirm('Tem certeza que deseja encerrar todas as sessões? Você precisará fazer login novamente.')) {
                terminateAllBtn.disabled = true;
                terminateAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Encerrando...';
                
                try {
                    const success = await authService.terminateAllSessions();
                    if (success) {
                        showNotification('Encerrando todas as sessões...', 'info');
                    }
                } catch (error) {
                    console.error('Erro ao encerrar sessões:', error);
                } finally {
                    terminateAllBtn.disabled = false;
                    terminateAllBtn.innerHTML = '<i class="fas fa-power-off"></i> Encerrar Todas as Sessões';
                }
            }
        });
    }
}

// Função para inicializar a página de perfil
async function initProfilePage() {
    console.log("Inicializando página de perfil...");
    
    clearAllNotifications();
    
    try {
        if (!authService.isAuthenticated()) {
            console.log("Usuário não autenticado, redirecionando...");
            showNotification('Faça login para acessar seu perfil', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }
        
        setupTabs();
        setupProfileButtons();
        setupAvatarUpload();
        setupAddMovieButton();
        setupSessionManagement();
        
        const loadingId = showNotification('Carregando seu perfil...', 'info', 5000);
        
        console.log("Buscando dados do usuário...");
        const userData = await profileService.fetchUserData();
        
        removeNotification(loadingId);
        
        if (!userData) {
            console.error("Falha ao buscar dados do usuário");
            return;
        }
        
        console.log("Dados do usuário recebidos:", userData);
        populateProfileInfo(userData);
        
        const [userReviews, userMovies, userSessions] = await Promise.all([
            profileService.fetchUserReviews(),
            profileService.fetchUserMovies(),
            profileService.fetchUserSessions()
        ]);
        
        console.log("Avaliações recebidas:", userReviews?.length || 0);
        console.log("Filmes recebidos:", userMovies?.length || 0);
        console.log("Sessões recebidas:", userSessions?.length || 0);
        
        renderUserReviews(userReviews);
        renderUserMovies(userMovies);
        renderUserSessions(userSessions);
        
        updateUserStats(userReviews, userMovies);
        
    } catch (error) {
        console.error('Erro ao inicializar página de perfil:', error);
        showNotification('Erro ao carregar suas informações', 'error');
    }
}

// Função para remover uma notificação específica
function removeNotification(id) {
    if (!id) return;
    
    const notification = document.querySelector(`[data-notification-id="${id}"]`);
    if (notification) {
        notification.remove();
    }
}

// Função para limpar todas as notificações
function clearAllNotifications() {
    const container = document.getElementById('notification-container');
    if (container) {
        container.innerHTML = '';
    }
}

// Função para dados mockados (enquanto o backend não está pronto)
function mockUserMovies() {
    return [
        {
            id: 1,
            title: "Interestelar",
            releaseYear: 2014,
            imageUrl: "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
            averageRating: 4.8,
            _count: { reviews: 15 },
            createdAt: "2023-05-10T14:32:00Z",
            userId: 1
        },
        {
            id: 2,
            title: "Clube da Luta",
            releaseYear: 1999,
            imageUrl: "https://m.media-amazon.com/images/M/MV5BMmEzNTkxYjQtZTc0MC00YTVjLTg5ZTEtZWMwOWVlYzY0NWIwXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
            averageRating: 4.5,
            _count: { reviews: 8 },
            createdAt: "2023-04-28T09:15:00Z",
            userId: 1
        },
        {
            id: 3,
            title: "Matrix",
            releaseYear: 1999,
            imageUrl: "https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg",
            averageRating: 4.7,
            _count: { reviews: 12 },
            createdAt: "2023-04-20T18:45:00Z",
            userId: 1
        }
    ];
}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM carregado, iniciando componentes...");
    
    initializeNavbar();
    
    setTimeout(() => {
        initProfilePage();
    }, 100);
});