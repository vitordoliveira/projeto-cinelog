// controllers/user/terminateSessionController.js
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

const prisma = new PrismaClient();

export default asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const sessionId = parseInt(req.params.sessionId);

  if (isNaN(sessionId)) {
    return res.status(400).json({ error: 'ID de sessão inválido' });
  }

  // Verificar se a sessão pertence ao usuário
  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      userId
    }
  });

  if (!session) {
    return res.status(404).json({ error: 'Sessão não encontrada' });
  }

  // Começar uma transação para garantir que tudo seja atualizado
  await prisma.$transaction([
    // Marcar sessão como inativa
    prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false }
    }),

    // Revogar todos os refresh tokens associados
    prisma.refreshToken.updateMany({
      where: {
        sessionId,
        isRevoked: false
      },
      data: { isRevoked: true }
    })
  ]);

  res.json({ message: 'Sessão encerrada com sucesso' });
});