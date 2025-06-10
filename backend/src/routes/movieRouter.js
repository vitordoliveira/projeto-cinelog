import { Router } from 'express';
import createMovieController from '../controllers/movie/createMovieController.js';
import getAllMoviesController from '../controllers/movie/getAllMoviesController.js';
import getMovieController from '../controllers/movie/getMovieController.js';
import updateMovieController from '../controllers/movie/updateMovieController.js';
import deleteMovieController from '../controllers/movie/deleteMovieController.js';
import { uploadImageController } from '../controllers/movie/uploadController.js';
import { validate } from '../middlewares/validate.js';
import { auth } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/adminMiddleware.js';
import { movieSchema } from '../schemas/movieSchemas.js';
import { validateUpload } from '../middlewares/validateUpload.js';
import reviewRouter from './reviewRouter.js';
import { getMovieStats, getMoviesList } from '../controllers/movie/adminMovieController.js';

const router = Router();

// ✅ ROTAS ESPECÍFICAS PRIMEIRO (antes das rotas com parâmetros)

// Rotas de administração
router.get('/admin/stats',
  auth,
  isAdmin,
  getMovieStats
);

router.get('/admin/list',
  auth,
  isAdmin,
  getMoviesList
);

// Upload de imagem
router.post('/upload', 
  auth, 
  validateUpload(), 
  (req, res, next) => {
    // Log para debug
    console.log('📤 [Upload] Iniciando processamento de upload');
    console.log('📦 [Upload] Files:', req.files);
    next();
  },
  uploadImageController
);

// Rota principal de filmes com paginação e busca
router.get('/', 
  (req, res, next) => {
    // Log para debug
    console.log('🔍 [Movies] Query params:', req.query);
    next();
  },
  getAllMoviesController
);

// Rota de criação
router.post('/', 
  auth, 
  validate(movieSchema),
  (req, res, next) => {
    // Log para debug
    console.log('➕ [Movies] Criando novo filme:', req.body);
    next();
  }, 
  createMovieController
);

// ✅ ROTAS COM PARÂMETROS POR ÚLTIMO

// Rota de detalhes do filme + reviews
router.get('/:movieId/detail', 
  (req, res, next) => {
    // Log para debug
    console.log('🎬 [Movies] Buscando detalhes do filme:', req.params.movieId);
    next();
  },
  getMovieController
);

// Rotas aninhadas de reviews
router.use('/:movieId/reviews', 
  (req, res, next) => {
    // Log para debug
    console.log('💭 [Reviews] Acessando reviews do filme:', req.params.movieId);
    next();
  },
  reviewRouter
);

// Rotas CRUD de filmes (COM VALIDAÇÃO DE ID NUMÉRICO)
router.get('/:id(\\d+)', 
  (req, res, next) => {
    // Log para debug
    console.log('🎥 [Movies] Buscando filme:', req.params.id);
    next();
  },
  getMovieController
);

router.put('/:id(\\d+)', 
  auth, 
  validate(movieSchema),
  (req, res, next) => {
    // Log para debug
    console.log('✏️ [Movies] Atualizando filme:', req.params.id);
    console.log('📝 [Movies] Dados:', req.body);
    next();
  }, 
  updateMovieController
);

router.delete('/:id(\\d+)', 
  auth,
  (req, res, next) => {
    // Log para debug
    console.log('🗑️ [Movies] Excluindo filme:', req.params.id);
    next();
  }, 
  deleteMovieController
);

// Middleware de erro para essa rota
router.use((err, req, res, next) => {
  console.error('🚨 [Movies Router Error]:', err);
  next(err);
});

export default router;