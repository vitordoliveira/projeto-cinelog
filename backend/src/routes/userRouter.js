import { Router } from 'express';
import createUserController from '../controllers/user/createUserController.js';
import loginUserController from '../controllers/user/loginUserController.js';
import getAllUsersController from '../controllers/user/getAllUsersController.js';
import getUserController from '../controllers/user/getUserController.js';
import updateUserController from '../controllers/user/updateUserController.js';
import deleteUserController from '../controllers/user/deleteUserController.js';
import getUserMeController from '../controllers/user/getUserMeController.js';
import getUserReviewsController from '../controllers/user/getUserReviewsController.js';
import getUserMoviesController from '../controllers/user/getUserMoviesController.js';
import generateAvatarController from '../controllers/user/generateAvatarController.js';
import uploadAvatarController from '../controllers/user/uploadAvatarController.js';
import refreshTokenController from '../controllers/user/refreshTokenController.js';
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

const router = Router();

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

// Rota para gerar/atualizar avatar
router.post(
  '/:id/avatar',
  auth,
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

// --- Novas rotas de administração ---

// Listar todos os usuários com detalhes (apenas admin)
router.get(
  '/admin/users',
  auth,
  isAdmin,
  asyncHandler(listAllUsers)
);

// Promover usuário para admin
router.put(
  '/admin/users/:userId/promote',
  auth,
  isAdmin,
  asyncHandler(promoteUser)
);

// Rebaixar usuário de admin para usuário comum
router.put(
  '/admin/users/:userId/demote',
  auth,
  isAdmin,
  asyncHandler(demoteUser)
);

// Exclusão de usuário por administrador
router.delete(
  '/admin/users/:userId',
  auth,
  isAdmin,
  asyncHandler(adminDeleteUser)
);

// NOVA ROTA: Exclusão de avaliação por administrador
router.delete(
  '/admin/reviews/:id',
  auth,
  isAdmin,
  asyncHandler(deleteReviewAdmin)
);

// Adicionar na userRouter.js
router.post(
  '/refresh-token',
  asyncHandler(refreshTokenController)
);

export default router;