// controllers/user/refreshTokenController.js
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

const prisma = new PrismaClient();

export default asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token não fornecido' });
  }

  try {
    // Verificar refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // Gerar novo access token
    const newAccessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { 
      expiresIn: '15m' 
    });

    // Enviar novo access token
    res.json({ token: newAccessToken });
  } catch (error) {
    return res.status(401).json({ error: 'Refresh token inválido' });
  }
});