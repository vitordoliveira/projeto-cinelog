// src/middlewares/errorHandler.js

import { Prisma } from '@prisma/client'; // Adicione esta linha

export const errorHandler = (error, req, res, next) => {
    console.error('❌ Erro:', error);
  
    // Erros de validação Zod
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Erro de validação',
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
  
    // Erros do Prisma ORM
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return res.status(409).json({ message: 'Registro duplicado (violação de campo único)' });
        case 'P2025':
          return res.status(404).json({ message: 'Registro não encontrado' });
        default:
          return res.status(500).json({ message: `Erro no banco de dados: ${error.code}` });
      }
    }
  
    // Erros de autenticação JWT
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido ou malformado' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
  
    // Erro de parse de JSON
    if (error?.type === 'entity.parse.failed' && error.message.includes('JSON')) {
      return res.status(400).json({ message: 'JSON inválido no corpo da requisição' });
    }
  
    // Erros do Cloudinary/Multer
    if (error.message.includes('File too large') || error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Arquivo excede o tamanho máximo permitido (5MB)' });
    }
  
    // Erro genérico (fallback)
    res.status(error.statusCode || 500).json({
      message: error.message || 'Erro interno do servidor',
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    });
  };