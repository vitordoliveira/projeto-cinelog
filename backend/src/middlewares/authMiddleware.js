// src/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: false });

    // Adicionado role na seleção dos dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true } // Agora inclui role
    });

    if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
    
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sessão expirada - faça login novamente' });
    }
    res.status(401).json({ error: 'Autenticação inválida' });
  }
};