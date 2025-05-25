import { Router } from 'express';
import { uploadImageController } from '../controllers/movie/uploadController.js';
import { auth } from '../middlewares/authMiddleware.js';
import { validateUpload } from '../middlewares/validateUpload.js'; // Novo middleware

const router = Router();

router.post('/upload', 
  auth,
  validateUpload({ maxSize: 5 * 1024 * 1024 }), // 5MB
  uploadImageController
);

export default router;