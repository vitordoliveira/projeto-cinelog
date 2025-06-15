// main.js

// Importar helpers e serviços necessários
import { authService } from './auth.js';
import { showNotification, handleApiError, formatDate, starRating } from './utils.js';
import { 
  renderMovieGrid, 
  renderMovieDetails, 
  renderReviewsList, 
  renderReviewForm, 
  fillEditMovieForm, 
  showRatingModal, 
  hideRatingModal 
} from './ui.js';

// Configurações da API
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

// Função helper para requisições autenticadas - SIMPLIFICADA
const fetchWithAuth = async (url, options = {}) => {
  try {
    const headers = {
      ...fetchConfig.headers,
      ...options.headers,
      'User-Agent': navigator.userAgent
    };

    console.log(`[Fetch] ${options.method || 'GET'} ${url}`);
    if (options.body && !(options.body instanceof FormData)) {
      console.log('[Fetch] Body:', options.body);
    }

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
    
    // Verificar se recebeu erro 401 (não autorizado)
    if (response.status === 401) {
      console.warn('[Fetch] Sessão expirada ou inválida');
      // Limpar estado de auth e redirecionar
      authService.clearAuthState();
      showNotification('Sessão expirada - faça login novamente', 'error');
      localStorage.setItem('redirectTo', window.location.pathname);
      window.location.href = 'login.html';
      throw new Error('Sessão expirada');
    }

    if (!response.ok && response.status === 403) {
      showNotification('Acesso negado', 'error');
      if (window.location.pathname !== '/index.html') {
        window.location.href = 'index.html';
      }
      return response;
    }
    
    console.log(`[Response] Status: ${response.status} ${response.statusText}`);
    return response;
  } catch (error) {
    console.error('[Fetch Error]', error);
    if (error.message.includes('Sessão expirada')) {
      // Já tratado acima
      return;
    }
    throw error;
  }
};

// --- Movie Service ---
const movieService = {
    // Busca filmes da API com paginação e parâmetros de busca opcionais
    async fetchMovies(params = {}) {
        try {
            console.log('[Movies] Buscando filmes com params:', params);
            
            const url = new URL(`${API}/movies`);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, value);
                }
            });

            const response = await fetchWithAuth(url);

            if (!response.ok) {
                throw new Error('Erro ao carregar filmes');
            }

            const data = await response.json();
            console.log('[Movies] Filmes recebidos:', data);
            
            return {
                movies: data.movies || data || [],
                totalPages: data.totalPages || 1
            };
        } catch (error) {
            console.error('[Movies Error]', error);
            showNotification('Erro ao carregar filmes', 'error');
            return { movies: [], totalPages: 1 };
        }
    },

    // Cria um novo filme
    async createMovie(movieData) {
        try {
            console.log('[Create] Iniciando criação de filme...');
            
            if (!authService.isAuthenticated()) {
                showNotification('Login necessário', 'error');
                localStorage.setItem('redirectTo', window.location.pathname);
                window.location.href = 'login.html';
                return null;
            }

            // Upload de imagem
            let imageUrl = null;
            if (movieData.imageFile) {
                console.log('[Create] Iniciando upload de imagem...');
                imageUrl = await this.handleImageUpload(movieData.imageFile);
                if (!imageUrl && movieData.imageFile) {
                    console.error('[Create] Falha no upload da imagem');
                    return null;
                }
                console.log('[Create] Upload concluído:', imageUrl);
            }

            // Preparar dados do filme
            const moviePayload = {
                title: movieData.title.trim(),
                description: movieData.description.trim(),
                releaseYear: parseInt(movieData.releaseYear),
                genre: movieData.genre?.trim() || "",
                director: movieData.director?.trim() || "",
                imageUrl: imageUrl
            };

            console.log('[Create] Enviando dados do filme:', moviePayload);

            // Criar filme
            const response = await fetchWithAuth(`${API}/movies`, {
                method: 'POST',
                body: JSON.stringify(moviePayload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao criar filme');
            }

            const newMovie = await response.json();
            console.log('[Create] Filme criado:', newMovie);
            
            setTimeout(() => window.location.href = 'index.html', 2000);

            return newMovie;
        } catch (error) {
            console.error('[Create Error]', error);
            showNotification(error.message || 'Erro ao criar filme', 'error');
            return null;
        }
    },

    // Busca detalhes de um filme específico
    async getMovieById(id) {
        try {
            console.log(`[Movie] Buscando filme ${id}`);
            
            if (!id) throw new Error('ID do filme não fornecido');
            
            const response = await fetchWithAuth(`${API}/movies/${id}`);
            
            if (!response.ok) {
                throw new Error('Filme não encontrado');
            }
            
            const movie = await response.json();
            console.log('[Movie] Dados recebidos:', movie);
            return movie;
        } catch (error) {
            console.error('[Movie Error]', error);
            showNotification(error.message, 'error');
            return null;
        }
    },

    // Atualiza um filme existente
    async updateMovie(movieData) {
        try {
            console.log('[Update] Iniciando atualização...');
            
            if (!movieData.id) {
                throw new Error('ID do filme não fornecido');
            }
            
            if (!authService.isAuthenticated()) {
                showNotification('Login necessário', 'error');
                localStorage.setItem('redirectTo', window.location.pathname);
                window.location.href = 'login.html';
                return null;
            }

            // Upload de nova imagem se fornecida
            let imageUrl = null;
            if (movieData.imageFile?.size > 0) {
                console.log('[Update] Processando nova imagem...');
                imageUrl = await this.handleImageUpload(movieData.imageFile);
                if (!imageUrl && movieData.imageFile) {
                    console.error('[Update] Falha no upload da imagem');
                    return null;
                }
            }

            // Preparar payload
            const payload = {
                title: movieData.title?.trim(),
                description: movieData.description?.trim(),
                releaseYear: parseInt(movieData.releaseYear),
                director: movieData.director?.trim() || null,
                genre: movieData.genre?.trim() || null
            };
            
            if (imageUrl || movieData.clearImage) {
                payload.imageUrl = imageUrl;
            }
            
            console.log('[Update] Enviando dados:', payload);

            const response = await fetchWithAuth(`${API}/movies/${movieData.id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao atualizar filme');
            }

            const updatedMovie = await response.json();
            console.log('[Update] Filme atualizado:', updatedMovie);
            
            return updatedMovie;
        } catch (error) {
            console.error('[Update Error]', error);
            showNotification(error.message, 'error');
            throw error;
        }
    },

    // Exclui um filme
    async deleteMovie(movieId) {
        try {
            console.log(`[Delete] Iniciando exclusão do filme ${movieId}`);
            
            if (!movieId) {
                throw new Error('ID do filme não fornecido');
            }
            
            if (!authService.isAuthenticated()) {
                showNotification('Login necessário', 'error');
                return false;
            }

            const response = await fetchWithAuth(`${API}/movies/${movieId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao excluir filme');
            }
            
            console.log('[Delete] Filme excluído com sucesso');
            return true;
        } catch (error) {
            console.error('[Delete Error]', error);
            showNotification(error.message, 'error');
            return false;
        }
    },

    // Upload de imagem
    async handleImageUpload(file) {
        if (!file) return null;

        try {
            console.log('[Upload] Iniciando upload...', {
                type: file.type,
                size: file.size
            });

            if (!file.type.startsWith('image/')) {
                throw new Error('Formato de arquivo inválido');
            }

            if (!authService.isAuthenticated()) {
                throw new Error('Login necessário');
            }

            const formData = new FormData();
            formData.append('image', file);

            console.log('[Upload] Enviando arquivo...');

            const response = await fetchWithAuth(`${API}/movies/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Erro no upload da imagem');
            }

            const data = await response.json();
            console.log('[Upload] Resposta:', data);

            if (!data.url) {
                throw new Error('URL da imagem não recebida');
            }

            return data.url;
        } catch (error) {
            console.error('[Upload Error]', error);
            showNotification(error.message, 'error');
            return null;
        }
    }
};

// --- Review Service ---
const reviewService = {
    async submitReview(movieId, reviewData) {
        try {
            console.log('[Review] Enviando avaliação...');
            
            if (!authService.isAuthenticated()) {
                showNotification('Login necessário', 'error');
                localStorage.setItem('redirectTo', window.location.pathname);
                window.location.href = 'login.html';
                return null;
            }

            const response = await fetchWithAuth(`${API}/movies/${movieId}/reviews`, {
                method: 'POST',
                body: JSON.stringify({
                    rating: Number(reviewData.rating),
                    comment: reviewData.comment?.trim()
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao enviar avaliação');
            }

            const newReview = await response.json();
            console.log('[Review] Avaliação enviada:', newReview);
            
            showNotification('Avaliação enviada com sucesso!', 'success');
            return newReview;
        } catch (error) {
            console.error('[Review Error]', error);
            showNotification(error.message, 'error');
            return null;
        }
    },

    async loadReviews(movieId) {
        try {
            console.log(`[Reviews] Carregando avaliações do filme ${movieId}`);
            
            const response = await fetchWithAuth(`${API}/movies/${movieId}/reviews`);
            
            if (!response.ok) {
                throw new Error('Erro ao carregar avaliações');
            }
            
            const reviews = await response.json();
            console.log('[Reviews] Avaliações carregadas:', reviews);
            return reviews;
        } catch (error) {
            console.error('[Reviews Error]', error);
            showNotification(error.message, 'error');
            return [];
        }
    },

    async deleteReview(movieId, reviewId) {
        try {
            console.log(`[Review] Excluindo avaliação ${reviewId}`);
            
            if (!authService.isAuthenticated()) {
                showNotification('Login necessário', 'error');
                return false;
            }

            const response = await fetchWithAuth(`${API}/movies/${movieId}/reviews/${reviewId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Erro ao excluir avaliação');
            }

            console.log('[Review] Avaliação excluída com sucesso');
            showNotification('Avaliação excluída com sucesso!', 'success');
            return true;
        } catch (error) {
            console.error('[Review Delete Error]', error);
            showNotification(error.message, 'error');
            return false;
        }
    }
};

// --- Session Service ---
const sessionService = {
    async getSessions() {
        try {
            if (!authService.isAuthenticated()) {
                throw new Error('Login necessário');
            }
            const response = await fetchWithAuth(`${API}/users/sessions`);
            if (!response.ok) {
                throw new Error('Erro ao carregar sessões');
            }
            return await response.json();
        } catch (error) {
            console.error('[Sessions Error]', error);
            showNotification(error.message, 'error');
            return [];
        }
    },

    async terminateSession(sessionId) {
        try {
            if (!authService.isAuthenticated()) {
                throw new Error('Login necessário');
            }
            const response = await fetchWithAuth(`${API}/users/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Erro ao encerrar sessão');
            }
            showNotification('Sessão encerrada com sucesso', 'success');
            if (sessionId === authService.getSessionId()) { // ATUALIZADO
                await authService.logout();
                window.location.href = 'login.html';
                return true;
            }
            return true;
        } catch (error) {
            console.error('[Terminate Session Error]', error);
            showNotification(error.message, 'error');
            return false;
        }
    },

    async terminateAllSessions() {
        try {
            if (!authService.isAuthenticated()) {
                throw new Error('Login necessário');
            }
            const response = await fetchWithAuth(`${API}/users/sessions`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Erro ao encerrar todas as sessões');
            }
            showNotification('Todas as sessões foram encerradas', 'success');
            setTimeout(async () => {
                await authService.logout();
                window.location.href = 'login.html';
            }, 1000);
            return true;
        } catch (error) {
            console.error('[Terminate All Sessions Error]', error);
            showNotification(error.message, 'error');
            return false;
        }
    }
};

// --- Paginação ---
const pagination = {
    currentPage: 1,
    totalPages: 1,
    paginationContainer: null,
    movieGridContainer: null,

    init(paginationContainerId = 'pagination', movieGridContainerId = 'movie-grid') {
        console.log('[Pagination] Inicializando...');
        
        this.paginationContainer = document.getElementById(paginationContainerId);
        this.movieGridContainer = document.getElementById(movieGridContainerId);
        
        if (this.paginationContainer) {
            this.setupEventListeners();
        }
        
        if (!this.movieGridContainer) {
            console.error(`[Pagination] Container #${movieGridContainerId} não encontrado`);
        }
    },

    setupEventListeners() {
        this.paginationContainer?.addEventListener('click', (event) => {
            const target = event.target;
            if (target.tagName === 'BUTTON') {
                if (target.classList.contains('prev-page')) {
                    this.loadPage(this.currentPage - 1);
                } else if (target.classList.contains('next-page')) {
                    this.loadPage(this.currentPage + 1);
                }
            }
        });
    },

    async loadPage(page) {
        if (!this.movieGridContainer || page < 1 || page > this.totalPages) return;

        console.log(`[Pagination] Carregando página ${page}`);
        this.movieGridContainer.innerHTML = '<p class="message info">Carregando filmes...</p>';

        const { movies, totalPages } = await movieService.fetchMovies({ page });
        this.currentPage = page;
        this.totalPages = totalPages;

        this.updatePaginationUI();
        renderMovieGrid(movies, this.movieGridContainer);
    },

    updatePaginationUI() {
        if (!this.paginationContainer) return;
        
        if (this.totalPages <= 1) {
            this.paginationContainer.style.display = 'none';
            return;
        }

        this.paginationContainer.style.display = 'flex';
        
        this.paginationContainer.innerHTML = `
            <button class="prev-page" ${this.currentPage <= 1 ? 'disabled' : ''}>
                Anterior
            </button>
            <span class="page-info">
                Página ${this.currentPage} de ${this.totalPages}
            </span>
            <button class="next-page" ${this.currentPage >= this.totalPages ? 'disabled' : ''}>
                Próxima
            </button>
        `;
    }
};

// --- Inicialização ---
const initHomePage = async () => {
    console.log('[Init] Iniciando página inicial...');
    try {
        pagination.init();
        if (pagination.movieGridContainer) {
            await pagination.loadPage(1);
        }
    } catch (error) {
        console.error('[Init Error]', error);
        showNotification('Erro ao carregar filmes', 'error');
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Init] Inicialização do sistema');
    
    // Aguardar inicialização do auth service
    await new Promise(resolve => {
        if (window.navbarInitialized) {
            resolve();
        } else {
            window.addEventListener('auth-initialized', () => resolve(), { once: true });
        }
    });

    const pathname = window.location.pathname;
    
    try {
        // Verificar autenticação para páginas protegidas
        if (pathname.endsWith('add.html') || 
            pathname.endsWith('edit.html') || 
            pathname.endsWith('profile.html') ||
            pathname.endsWith('sessions.html')) {
            
            if (!authService.isAuthenticated()) {
                localStorage.setItem('redirectTo', pathname);
                window.location.href = 'login.html';
                return;
            }
        }

        // Verificar permissões de admin
        if (pathname.endsWith('admin.html') && !authService.isAdmin()) {
            showNotification('Acesso restrito', 'error');
            window.location.href = 'index.html';
            return;
        }

        // Inicializar página específica
        if (pathname === '/' || pathname.endsWith('index.html')) {
            await initHomePage();
        }
    } catch (error) {
        console.error('[Init Error]', error);
        showNotification('Erro no carregamento', 'error');
    }
});

// Exportar serviços
export { movieService, reviewService, sessionService, pagination };