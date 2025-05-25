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

// Rotas principais de filmes
router.post('/', 
  auth, 
  validate(movieSchema), 
  createMovieController
);

router.get('/', 
  getAllMoviesController
);

// Rota de detalhes do filme + reviews
router.get('/:movieId/detail', 
  getMovieController // Mantido para compatibilidade
);

// Rotas aninhadas de reviews
router.use('/:movieId/reviews', reviewRouter); // Toda gestão de reviews aqui

// Rotas CRUD de filmes
router.get('/:id', 
  getMovieController
);

router.put('/:id', 
  auth, 
  validate(movieSchema), 
  updateMovieController
);

router.delete('/:id', 
  auth, 
  deleteMovieController
);

// Upload de imagem (mantido como endpoint separado)
router.post('/upload', 
  auth, 
  validateUpload(), 
  uploadImageController
);

export default router;