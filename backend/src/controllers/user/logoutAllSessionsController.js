// controllers/user/logoutAllSessionsController.js
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

const prisma = new PrismaClient();

export default asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Começar uma transação para garantir que tudo seja atualizado
  await prisma.$transaction([
    // Marcar todas as sessões como inativas
    prisma.session.updateMany({
      where: {
        userId,
        isActive: true
      },
      data: { isActive: false }
    }),

    // Revogar todos os refresh tokens
    prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false
      },
      data: { isRevoked: true }
    })
  ]);

  res.json({ message: 'Todas as sessões foram encerradas' });
});