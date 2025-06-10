// middlewares/adminMiddleware.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Não autorizado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Correção: verificar role ao invés de isAdmin
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ message: 'Acesso proibido - somente administradores' });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar permissões de administrador:', error);
    res.status(500).json({ message: 'Erro ao verificar permissões de administrador' });
  }
};