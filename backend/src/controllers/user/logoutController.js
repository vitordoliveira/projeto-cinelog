// controllers/user/logoutController.js
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

const prisma = new PrismaClient();

export default asyncHandler(async (req, res) => {
  try {
    const sessionId = req.sessionId;
    
    if (sessionId) {
      // Marcar sessão atual como inativa
      await prisma.session.update({
        where: { id: sessionId },
        data: { isActive: false }
      });

      // Revogar refresh token da sessão atual
      await prisma.refreshToken.updateMany({
        where: {
          sessionId: sessionId,
          isRevoked: false
        },
        data: { isRevoked: true }
      });

      console.log(`✅ Sessão ${sessionId} encerrada com sucesso`);
    }

    // Limpar todos os cookies de autenticação
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    res.clearCookie('sessionId', { path: '/' });

    console.log('🍪 Cookies de autenticação limpos');

    res.json({ 
      success: true,
      message: 'Logout realizado com sucesso' 
    });

  } catch (error) {
    console.error('❌ Erro no logout:', error);
    
    // Mesmo com erro, limpar os cookies
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    res.clearCookie('sessionId', { path: '/' });

    res.json({ 
      success: true,
      message: 'Logout realizado (com limpeza de emergência)' 
    });
  }
});