import { movieService } from './main.js';
import { authService } from './auth.js';
import { showNotification } from './utils.js';

/**
 * Inicializa a página de edição de filme
 */
export async function initEditMoviePage() {
    console.log('[Edit] Inicializando página de edição...');
    
    // Variáveis globais
    const movieId = new URLSearchParams(window.location.search).get('id');
    const editForm = document.getElementById('edit-movie-form');
    const backLink = document.getElementById('back-link');
    const description = document.getElementById('description');
    const charCounter = document.getElementById('char-counter');
    const fileInput = document.getElementById('image');
    const fileNameDisplay = document.getElementById('file-name');
    let originalMovie = null;
    
    // Configurar textareas
    setupTextareas();
    
    // Configurar file input
    setupFileInput(fileInput, fileNameDisplay);
    
    // Configurar contador de caracteres
    setupCharCounter(description, charCounter);
    
    // Configurar link de voltar
    setupBackLink(backLink, movieId);
    
    // Verificações iniciais
    if (!authService.isAuthenticated()) {
        showNotification('Você precisa estar logado para editar filmes.', 'error');
        localStorage.setItem('redirectTo', window.location.pathname + window.location.search);
        return window.location.href = './login.html';
    }
    
    if (!movieId) {
        showNotification('ID do filme não encontrado.', 'error');
        return window.location.href = './index.html';
    }
    
    // Carregar dados do filme
    await loadMovieData(movieId, editForm, charCounter);
}

/**
 * Configura todos os textareas para não serem redimensionáveis
 */
function setupTextareas() {
    const allTextareas = document.querySelectorAll('textarea');
    allTextareas.forEach(textarea => {
        textarea.style.resize = 'none';
        
        // Prevenir redimensionamento
        textarea.addEventListener('mousedown', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (x > rect.width - 20 && y > rect.height - 20) {
                e.preventDefault();
            }
        });
    });
}

/**
 * Configura o input de arquivo
 */
function setupFileInput(fileInput, fileNameDisplay) {
    if (fileInput && fileNameDisplay) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                fileNameDisplay.textContent = this.files[0].name;
            } else {
                fileNameDisplay.textContent = 'Nenhum arquivo selecionado';
            }
        });
    }
}

/**
 * Configura o contador de caracteres
 */
function setupCharCounter(description, charCounter) {
    if (description && charCounter) {
        description.addEventListener('input', function() {
            updateCharCounter(this.value.length, charCounter);
        });
    }
}

/**
 * Atualiza o contador de caracteres
 */
function updateCharCounter(currentLength, charCounter) {
    charCounter.textContent = `${currentLength} caracteres`;
    
    if (currentLength > 2000) {
        charCounter.className = 'char-counter danger';
    } else if (currentLength > 1500) {
        charCounter.className = 'char-counter warning';
    } else {
        charCounter.className = 'char-counter';
    }
}

/**
 * Configura o link de voltar
 */
function setupBackLink(backLink, movieId) {
    if (backLink) {
        backLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = `movie-detail.html?id=${movieId}`;
        });
    }
}

/**
 * Carrega os dados do filme
 */
async function loadMovieData(movieId, editForm, charCounter) {
    try {
        console.log('[Edit] Carregando dados do filme ID:', movieId);
        
        const movie = await movieService.getMovieById(movieId);
        if (!movie) {
            throw new Error('Filme não encontrado');
        }
        
        console.log('[Edit] Dados do filme carregados:', movie);
        
        // Preencher formulário
        fillForm(editForm, movie, charCounter);
        
        // Configurar imagem atual
        setupCurrentImage(movie);
        
        // Configurar formulário
        setupForm(editForm, movie, movieId);
        
    } catch (error) {
        console.error('[Edit] Erro ao carregar filme:', error);
        showNotification('Erro ao carregar dados do filme', 'error');
        window.location.href = './index.html';
    }
}

/**
 * Preenche o formulário com os dados do filme
 */
function fillForm(editForm, movie, charCounter) {
    editForm.querySelector('#title').value = movie.title || '';
    editForm.querySelector('#director').value = movie.director || '';
    editForm.querySelector('#genre').value = movie.genre || '';
    editForm.querySelector('#releaseYear').value = movie.releaseYear || '';
    
    // Preencher descrição e atualizar contador
    const descElement = editForm.querySelector('#description');
    descElement.value = movie.description || '';
    
    if (charCounter) {
        updateCharCounter(descElement.value.length, charCounter);
    }
}

/**
 * Configura a exibição da imagem atual
 */
function setupCurrentImage(movie) {
    const currentImageContainer = document.getElementById('current-image-container');
    if (!currentImageContainer) return;
    
    if (movie.imageUrl) {
        currentImageContainer.innerHTML = `
            <p>Imagem Atual:</p>
            <img src="${movie.imageUrl}" alt="Imagem atual">
            <div class="checkbox-group">
                <input type="checkbox" id="keepImage" name="keepImage" checked>
                <label for="keepImage">Manter esta imagem</label>
            </div>
            <div class="checkbox-group" style="display:none;">
                <input type="checkbox" id="clearImage" name="clearImage">
                <label for="clearImage">Remover imagem</label>
            </div>
        `;
        
        // Sincronizar checkboxes
        const keepImageCheckbox = document.getElementById('keepImage');
        const clearImageCheckbox = document.getElementById('clearImage');
        
        keepImageCheckbox.addEventListener('change', function() {
            clearImageCheckbox.checked = !this.checked;
        });
    } else {
        currentImageContainer.innerHTML = '<p>Nenhuma imagem cadastrada para este filme</p>';
    }
}

/**
 * Configura o formulário de edição
 */
function setupForm(editForm, movie, movieId) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitButton = editForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';
        
        try {
            const formData = new FormData(editForm);
            const movieData = buildMovieData(formData, movie);
            
            // Validações
            if (!validateForm(movieData, submitButton)) {
                return;
            }
            
            console.log('[Edit] Enviando dados para atualização:', movieData);
            
            const updatedMovie = await movieService.updateMovie(movieData);
            
            console.log('[Edit] Filme atualizado com sucesso:', updatedMovie);
            showNotification('Filme atualizado com sucesso!', 'success');
            
            setTimeout(() => {
                window.location.href = `movie-detail.html?id=${movieId}`;
            }, 1500);
            
        } catch (error) {
            console.error('[Edit] Erro ao atualizar filme:', error);
            showNotification('Erro ao atualizar filme. Tente novamente.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar Alterações';
        }
    });
}

/**
 * Constrói o objeto de dados do filme
 */
function buildMovieData(formData, movie) {
    const keepImage = document.getElementById('keepImage')?.checked;
    const clearImage = document.getElementById('clearImage')?.checked;
    const imageFile = formData.get('image');
    
    const movieData = {
        id: movie.id,
        title: formData.get('title')?.trim(),
        description: formData.get('description')?.trim(),
        releaseYear: parseInt(formData.get('releaseYear')),
        director: formData.get('director')?.trim() || "",
        genre: formData.get('genre')?.trim() || "",
    };
    
    // Gerenciar imagem
    if (imageFile && imageFile.size > 0) {
        movieData.imageFile = imageFile;
    } else if (clearImage) {
        movieData.clearImage = true;
    } else if (keepImage && movie.imageUrl) {
        movieData.keepExistingImage = true;
    }
    
    return movieData;
}

/**
 * Valida o formulário
 */
function validateForm(movieData, submitButton) {
    if (!movieData.title || !movieData.description || !movieData.releaseYear) {
        showNotification('Preencha todos os campos obrigatórios', 'error');
        submitButton.disabled = false;
        submitButton.textContent = 'Salvar Alterações';
        return false;
    }
    
    if (movieData.description.length > 5000) {
        showNotification('A descrição é muito longa. Por favor, reduza o texto.', 'error');
        submitButton.disabled = false;
        submitButton.textContent = 'Salvar Alterações';
        return false;
    }
    
    return true;
}