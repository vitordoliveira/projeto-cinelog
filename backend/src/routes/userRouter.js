import { Router } from 'express';
import createUserController from '../controllers/user/createUserController.js';
import loginUserController from '../controllers/user/loginUserController.js';
import logoutController from '../controllers/user/logoutController.js'; // ADICIONADO
import getAllUsersController from '../controllers/user/getAllUsersController.js';
import getUserController from '../controllers/user/getUserController.js';
import updateUserController from '../controllers/user/updateUserController.js';
import deleteUserController from '../controllers/user/deleteUserController.js';
import getUserMeController from '../controllers/user/getUserMeController.js';
import getUserReviewsController from '../controllers/user/getUserReviewsController.js';
import getUserMoviesController from '../controllers/user/getUserMoviesController.js';
import generateAvatarController from '../controllers/user/generateAvatarController.js';
import uploadAvatarController from '../controllers/user/uploadAvatarController.js';
import getSessionsController from '../controllers/user/getSessionsController.js';
import terminateSessionController from '../controllers/user/terminateSessionController.js';
import logoutAllSessionsController from '../controllers/user/logoutAllSessionsController.js';
import { 
  listAllUsers, 
  promoteUser, 
  demoteUser, 
  deleteUser as adminDeleteUser 
} from '../controllers/user/adminUserController.js';
import { deleteReviewAdmin } from '../controllers/review/adminReviewController.js';
import { validate } from '../middlewares/validate.js';
import { auth } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/adminMiddleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { registerSchema, loginSchema, updateUserSchema } from '../schemas/userSchemas.js';
import { validateUpload } from '../middlewares/validateUpload.js';

const router = Router();

// Rotas de autenticação (públicas)
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(createUserController)
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(loginUserController)
);

// ADICIONADO: Rota de logout
router.post(
  '/logout',
  auth,
  asyncHandler(logoutController)
);

// Rotas de sessão
router.get(
  '/sessions',
  auth,
  asyncHandler(getSessionsController)
);

// ADICIONADO: Encerrar TODAS as sessões do usuário logado (DELETE /sessions)
router.delete(
  '/sessions',
  auth,
  asyncHandler(logoutAllSessionsController)
);

router.delete(
  '/sessions/:sessionId',
  auth,
  asyncHandler(terminateSessionController)
);

// Rotas protegidas (requerem autenticação)
router.get(
  '/',
  auth,
  asyncHandler(getAllUsersController)
);

router.get(
  '/me',
  auth,
  asyncHandler(getUserMeController)
);

router.get(
  '/me/reviews',
  auth,
  asyncHandler(getUserReviewsController)
);

router.get(
  '/me/movies',
  auth,
  asyncHandler(getUserMoviesController)
);

router.get(
  '/:id',
  auth,
  asyncHandler(getUserController)
);

router.put(
  '/:id',
  auth,
  validate(updateUserSchema),
  asyncHandler(updateUserController)
);

router.post(
  '/:id/avatar',
  auth,
  validateUpload('avatar'),
  asyncHandler(uploadAvatarController)
);

router.delete(
  '/:id',
  auth,
  asyncHandler(deleteUserController)
);

router.post(
  '/:id/avatar/generate',
  auth,
  asyncHandler(generateAvatarController)
);

// Rotas de administração
router.get(
  '/admin/users',
  auth,
  isAdmin,
  asyncHandler(listAllUsers)
);

router.put(
  '/admin/users/:userId/promote',
  auth,
  isAdmin,
  asyncHandler(promoteUser)
);

router.put(
  '/admin/users/:userId/demote',
  auth,
  isAdmin,
  asyncHandler(demoteUser)
);

router.delete(
  '/admin/users/:userId',
  auth,
  isAdmin,
  asyncHandler(adminDeleteUser)
);

router.delete(
  '/admin/reviews/:id',
  auth,
  isAdmin,
  asyncHandler(deleteReviewAdmin)
);

export default router;