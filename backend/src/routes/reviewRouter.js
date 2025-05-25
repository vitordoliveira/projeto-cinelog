import { Router } from 'express';
import createReviewController from '../controllers/review/createReviewController.js';
import getReviewsByMovieController from '../controllers/review/getReviewsByMovieController.js';
import updateReviewController from '../controllers/review/updateReviewController.js';
import deleteReviewController from '../controllers/review/deleteReviewController.js';
import { 
  deleteReviewAdmin, 
  getReviewStats, 
  listAllReviews 
} from '../controllers/review/adminReviewController.js';
import { validate } from '../middlewares/validate.js';
import { auth } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/adminMiddleware.js';
import { reviewSchema } from '../schemas/reviewSchemas.js';

const router = Router({ mergeParams: true }); // Mantém movieId do router pai

// --- Rotas de administração ---
// Estas rotas devem ser definidas antes das rotas que usam :reviewId
// para evitar conflitos na captura de parâmetros

// GET /reviews/admin/stats - Estatísticas para admin
router.get('/admin/stats',
  auth,
  isAdmin,
  getReviewStats
);

// GET /reviews/admin/list - Listar todas reviews para admin
router.get('/admin/list',
  auth,
  isAdmin,
  listAllReviews
);

// DELETE /reviews/admin/:id - Excluir uma review como admin
router.delete('/admin/:id',
  auth,
  isAdmin,
  deleteReviewAdmin
);

// --- Rotas de Review ---
// POST /movies/:movieId/reviews
router.post('/', 
  auth, 
  validate(reviewSchema),
  createReviewController
);

// GET /movies/:movieId/reviews
router.get('/', 
  getReviewsByMovieController
);

// PUT /movies/:movieId/reviews/:reviewId
router.put('/:reviewId', 
  auth, 
  validate(reviewSchema), 
  updateReviewController
);

// DELETE /movies/:movieId/reviews/:reviewId
router.delete('/:reviewId', 
  auth, 
  deleteReviewController
);

export default router;