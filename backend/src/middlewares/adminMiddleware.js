// src/middlewares/adminMiddleware.js
import { asyncHandler } from './asyncHandler.js';

export const isAdmin = asyncHandler(async (req, res, next) => {
  // O middleware auth deve ser executado antes deste
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Autenticação necessária' 
    });
  }
  
  // Verificar se o usuário tem a role de ADMIN
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Acesso negado. Esta funcionalidade requer privilégios de administrador.' 
    });
  }
  
  // Se chegou até aqui, o usuário é admin
  next();
});