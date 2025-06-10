// src/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const verifyToken = async (token, secret) => {
  try {
    return jwt.verify(token, secret, { ignoreExpiration: false });
  } catch (err) {
    return null;
  }
};

const validateSession = async (sessionId, userId, deviceInfo) => {
  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      userId: userId,
      isActive: true,
      deviceInfo: deviceInfo
    }
  });

  if (!session) return false;

  // Verifica se a sessão não está inativa há muito tempo (30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  if (session.lastActivity < thirtyDaysAgo) {
    await prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false }
    });
    return false;
  }

  return true;
};

export const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const deviceInfo = req.headers['user-agent'] || 'unknown';
  const ipAddress = req.ip || req.connection.remoteAddress;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    // Extrair access token
    const accessToken = authHeader.split(' ')[1];
    
    // Verificar access token
    const decoded = await verifyToken(accessToken, process.env.JWT_SECRET);
    
    if (!decoded) {
      // Se o access token for inválido, verificar o refresh token
      const refreshToken = req.headers['x-refresh-token'];
      
      if (!refreshToken) {
        return res.status(401).json({ 
          error: 'Sessão expirada',
          code: 'TOKEN_EXPIRED'
        });
      }

      // Verificar refresh token no banco
      const storedRefreshToken = await prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          isRevoked: false,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true
            }
          },
          session: true
        }
      });

      if (!storedRefreshToken || !storedRefreshToken.user.isActive) {
        return res.status(401).json({ 
          error: 'Refresh token inválido',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      // Verificar se a sessão ainda está ativa
      const sessionValid = await validateSession(
        storedRefreshToken.sessionId,
        storedRefreshToken.userId,
        deviceInfo
      );

      if (!sessionValid) {
        // Revogar refresh token se a sessão não for mais válida
        await prisma.refreshToken.update({
          where: { id: storedRefreshToken.id },
          data: { isRevoked: true }
        });

        return res.status(401).json({ 
          error: 'Sessão inválida',
          code: 'INVALID_SESSION'
        });
      }

      // Gerar novo access token
      const newAccessToken = jwt.sign(
        { 
          userId: storedRefreshToken.user.id,
          sessionId: storedRefreshToken.sessionId
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
      );

      // Incluir novo access token na resposta
      res.setHeader('X-New-Access-Token', newAccessToken);
      
      req.user = storedRefreshToken.user;
      req.sessionId = storedRefreshToken.sessionId;
    } else {
      // Se o access token for válido, verificar se a sessão ainda está ativa
      const sessionValid = await validateSession(
        decoded.sessionId,
        decoded.userId,
        deviceInfo
      );

      if (!sessionValid) {
        return res.status(401).json({ 
          error: 'Sessão inválida',
          code: 'INVALID_SESSION'
        });
      }

      // Buscar dados do usuário
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { 
          id: true, 
          name: true, 
          email: true, 
          role: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ 
          error: 'Usuário não encontrado ou inativo',
          code: 'USER_NOT_FOUND'
        });
      }

      req.user = user;
      req.sessionId = decoded.sessionId;
    }

    // Atualizar último acesso da sessão
    await prisma.session.update({
      where: { id: req.sessionId },
      data: { 
        lastActivity: new Date(),
        ipAddress: ipAddress // Atualiza o IP em cada requisição
      }
    });

    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Sessão expirada - faça login novamente',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    res.status(401).json({ 
      error: 'Autenticação inválida',
      code: 'INVALID_AUTH'
    });
  }
};