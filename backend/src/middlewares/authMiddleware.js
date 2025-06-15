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
  const deviceInfo = req.headers['user-agent'] || 'unknown';
  const ipAddress = req.ip || req.connection.remoteAddress;
  
  // NOVA LÓGICA: Tentar cookies primeiro, depois headers (compatibilidade)
  let accessToken = req.cookies?.accessToken; // Cookies HttpOnly
  let refreshToken = req.cookies?.refreshToken;
  
  // Fallback para headers (compatibilidade durante transição)
  if (!accessToken) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      accessToken = authHeader.split(' ')[1];
    }
  }
  
  if (!refreshToken) {
    refreshToken = req.headers['x-refresh-token'];
  }
  
  // Se não tem nem cookie nem header, não autorizado
  if (!accessToken && !refreshToken) {
    return res.status(401).json({ 
      error: 'Token não fornecido',
      code: 'NO_TOKEN'
    });
  }

  try {
    let decoded = null;
    
    // Verificar access token se existir
    if (accessToken) {
      decoded = await verifyToken(accessToken, process.env.JWT_SECRET);
    }
    
    if (!decoded && refreshToken) {
      // Access token inválido/expirado, tentar refresh token
      console.log('🔄 Access token inválido, tentando refresh token...');
      
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
              isActive: true,
              avatarUrl: true,
              createdAt: true
            }
          },
          session: true
        }
      });

      if (!storedRefreshToken || !storedRefreshToken.user.isActive) {
        // Limpar cookies inválidos
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.clearCookie('sessionId');
        
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

        // Limpar cookies inválidos
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.clearCookie('sessionId');

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

      // DEFINIR NOVO ACCESS TOKEN EM COOKIE
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutos
        path: '/'
      });

      // Também incluir no header para compatibilidade
      res.setHeader('X-New-Access-Token', newAccessToken);
      
      req.user = storedRefreshToken.user;
      req.sessionId = storedRefreshToken.sessionId;

      console.log(`✅ Token renovado para usuário ${storedRefreshToken.user.id}`);
      
    } else if (decoded) {
      // Access token válido
      const sessionValid = await validateSession(
        decoded.sessionId,
        decoded.userId,
        deviceInfo
      );

      if (!sessionValid) {
        // Limpar cookies inválidos
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.clearCookie('sessionId');
        
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
          isActive: true,
          avatarUrl: true,
          createdAt: true
        }
      });

      if (!user || !user.isActive) {
        // Limpar cookies para usuário inválido
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.clearCookie('sessionId');
        
        return res.status(401).json({ 
          error: 'Usuário não encontrado ou inativo',
          code: 'USER_NOT_FOUND'
        });
      }

      req.user = user;
      req.sessionId = decoded.sessionId;
    } else {
      // Nem access token nem refresh token válidos
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.clearCookie('sessionId');
      
      return res.status(401).json({ 
        error: 'Tokens inválidos',
        code: 'INVALID_TOKENS'
      });
    }

    // Atualizar último acesso da sessão
    await prisma.session.update({
      where: { id: req.sessionId },
      data: { 
        lastActivity: new Date(),
        ipAddress: ipAddress
      }
    });

    next();
  } catch (err) {
    console.error('❌ Auth Middleware Error:', err);
    
    // Limpar cookies em caso de erro
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('sessionId');
    
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