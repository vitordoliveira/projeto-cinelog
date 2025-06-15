// js/add.js
import { movieService } from './main.js';
import { showNotification } from './utils.js';
import { authService } from './auth.js';

// Constantes para configuração de imagem
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_DIMENSION = 1920; // Máxima dimensão permitida
const JPEG_QUALITY = 0.8; // Qualidade da compressão JPEG

// Função para comprimir imagem
const compressImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Redimensionar se necessário
                if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
                    if (width > height) {
                        height *= MAX_IMAGE_DIMENSION / width;
                        width = MAX_IMAGE_DIMENSION;
                    } else {
                        width *= MAX_IMAGE_DIMENSION / height;
                        height = MAX_IMAGE_DIMENSION;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Converter para JPEG com compressão
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Falha ao comprimir imagem'));
                        return;
                    }
                    
                    // Criar novo arquivo com metadados
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    
                    resolve(compressedFile);
                }, 'image/jpeg', JPEG_QUALITY);
            };
            
            img.onerror = () => {
                reject(new Error('Erro ao carregar imagem'));
            };
        };
        
        reader.onerror = () => {
            reject(new Error('Erro ao ler arquivo'));
        };
    });
};

// Função para preview da imagem
const setupImagePreview = () => {
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('image-preview');
    const previewContainer = document.getElementById('preview-container');
    const clearImageBtn = document.getElementById('clear-image');
    const imageSize = document.getElementById('image-size');

    if (imageInput && imagePreview) {
        imageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    showNotification('Por favor, selecione apenas arquivos de imagem.', 'error');
                    imageInput.value = '';
                    return;
                }

                if (file.size > MAX_FILE_SIZE) {
                    showNotification(`A imagem deve ter no máximo ${MAX_FILE_SIZE / (1024 * 1024)}MB.`, 'warning');
                    try {
                        const compressedFile = await compressImage(file);
                        if (compressedFile.size > MAX_FILE_SIZE) {
                            showNotification('Mesmo após compressão, arquivo muito grande.', 'error');
                            imageInput.value = '';
                            return;
                        }
                        
                        // Atualizar input com arquivo comprimido
                        const container = new DataTransfer();
                        container.items.add(compressedFile);
                        imageInput.files = container.files;
                        
                        if (imageSize) {
                            imageSize.textContent = `Tamanho após compressão: ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB`;
                        }
                        
                        showNotification('Imagem comprimida com sucesso!', 'success');
                    } catch (error) {
                        console.error('[Image] Erro na compressão:', error);
                        showNotification('Erro ao processar imagem', 'error');
                        imageInput.value = '';
                        return;
                    }
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.src = e.target.result;
                    previewContainer?.classList.remove('hidden');
                    if (imageSize && file) {
                        imageSize.textContent = `Tamanho: ${(file.size / (1024 * 1024)).toFixed(2)}MB`;
                    }
                };
                reader.onerror = () => {
                    showNotification('Erro ao ler o arquivo.', 'error');
                    imageInput.value = '';
                };
                reader.readAsDataURL(file);
            }
        });

        // Botão para limpar imagem
        clearImageBtn?.addEventListener('click', () => {
            imageInput.value = '';
            imagePreview.src = '';
            previewContainer?.classList.add('hidden');
            if (imageSize) {
                imageSize.textContent = '';
            }
        });
    }
};

// Função para inicializar a página de adição de filme
const initAddMoviePage = async () => {
    console.log('[Add] Inicializando página de adição de filme...');

    // Verificar autenticação
    if (!authService.isAuthenticated()) {
        console.log('[Add] Usuário não autenticado, redirecionando...');
        showNotification('Login necessário para adicionar filmes', 'error');
        localStorage.setItem('redirectTo', window.location.pathname);
        window.location.href = 'login.html';
        return;
    }

    const form = document.getElementById('add-movie-form');
    if (!form) {
        console.error('[Add] Formulário não encontrado');
        return;
    }

    // Configurar preview de imagem
    setupImagePreview();

    // Configurar data máxima como ano atual
    const currentYear = new Date().getFullYear();
    const yearInput = document.getElementById('releaseYear');
    if (yearInput) {
        yearInput.max = currentYear + 1; // Permite filmes do próximo ano
        yearInput.value = currentYear; // Ano atual como padrão
    }

    // Handler do formulário
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        // Desabilitar o botão de submit
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Processando...';
        }
        
        try {
            // Verificar autenticação novamente
            if (!authService.isAuthenticated()) {
                throw new Error('Sessão expirada. Por favor, faça login novamente.');
            }

            // Coletar dados do formulário
            const formData = {
                title: form.title.value.trim(),
                director: form.director.value.trim(),
                genre: form.genre.value.trim(),
                description: form.description.value.trim(),
                releaseYear: parseInt(form.releaseYear.value),
                imageFile: form.image.files[0]
            };

            console.log('[Add] Dados do formulário:', {
                ...formData,
                imageFile: formData.imageFile ? {
                    name: formData.imageFile.name,
                    type: formData.imageFile.type,
                    size: formData.imageFile.size
                } : null
            });

            // Validações
            if (!formData.title) {
                throw new Error('O título é obrigatório');
            }
            if (!formData.description) {
                throw new Error('A descrição é obrigatória');
            }
            if (isNaN(formData.releaseYear) || formData.releaseYear < 1888) {
                throw new Error('Ano de lançamento inválido');
            }

            // Comprimir imagem se necessário
            if (formData.imageFile && formData.imageFile.size > MAX_FILE_SIZE) {
                try {
                    formData.imageFile = await compressImage(formData.imageFile);
                } catch (error) {
                    console.error('[Add] Erro na compressão:', error);
                    throw new Error('Erro ao processar imagem');
                }
            }

            // Tentar criar o filme
            showNotification('Enviando dados...', 'info');
            const result = await movieService.createMovie(formData);
            
            if (result) {
                console.log('[Add] Filme criado com sucesso:', result);
                showNotification('Filme adicionado com sucesso!', 'success');
                
                // Redirecionar após 2 segundos
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }
        } catch (error) {
            console.error('[Add] Erro:', error);
            showNotification(
                error.message || 'Erro ao adicionar filme. Tente novamente.',
                'error'
            );
        } finally {
            // Reabilitar o botão de submit
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Adicionar Filme';
            }
        }
    });
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Add] DOM carregado, inicializando...');
    initAddMoviePage().catch(error => {
        console.error('[Add] Erro na inicialização:', error);
        showNotification('Erro ao carregar página', 'error');
    });
});

// Exportar para uso em testes ou outros módulos
export { initAddMoviePage };