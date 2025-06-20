// controllers/user/loginUserController.js
import { getUserByEmail } from '../../models/userModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Função para gerar refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// Configurações de cookie consistentes
const getCookieOptions = (maxAge) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: false, // Sempre false em desenvolvimento local
    sameSite: 'lax', // Mudado de 'strict' para 'lax' para melhor compatibilidade
    path: '/',
    maxAge,
    domain: undefined // Não definir domain para localhost
  };
};

// Função para criar nova sessão
const createSession = async (userId, req) => {
  const deviceInfo = req.headers['user-agent'] || 'unknown';
  const ipAddress = req.ip || req.connection.remoteAddress;

  return prisma.session.create({
    data: {
      userId,
      deviceInfo,
      ipAddress,
      userAgent: deviceInfo,
      lastActivity: new Date(),
      isActive: true
    }
  });
};

// Função para criar refresh token
const createRefreshToken = async (userId, sessionId) => {
  // Expiração do refresh token: 30 dias
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const token = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      sessionId,
      expiresAt,
      isRevoked: false
    }
  });

  return token;
};

// Função para revogar sessões antigas do mesmo dispositivo
const revokeOldSessions = async (userId, deviceInfo) => {
  await prisma.session.updateMany({
    where: {
      userId,
      deviceInfo,
      isActive: true
    },
    data: {
      isActive: false
    }
  });
};

export default asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await getUserByEmail(email);
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  let session;

  try {
    // 1. Revogar sessões antigas do mesmo dispositivo
    await revokeOldSessions(user.id, req.headers['user-agent']);

    // 2. Criar nova sessão
    session = await createSession(user.id, req);

    // 3. Gerar access token (validade curta - 15 minutos)
    const accessToken = jwt.sign(
      { 
        userId: user.id,
        sessionId: session.id
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '15m' }
    );

    // 4. Gerar refresh token (validade longa - 30 dias)
    const refreshToken = await createRefreshToken(user.id, session.id);

    // 5. Configurar cookies HttpOnly com opções consistentes
    
    // Cookie para access token (15 minutos)
    res.cookie('accessToken', accessToken, getCookieOptions(15 * 60 * 1000));

    // Cookie para refresh token (30 dias)
    res.cookie('refreshToken', refreshToken, getCookieOptions(30 * 24 * 60 * 60 * 1000));

    // Cookie para session ID (frontend pode ler)
    res.cookie('sessionId', session.id, {
      ...getCookieOptions(30 * 24 * 60 * 60 * 1000),
      httpOnly: false // Frontend pode ler este
    });

    // 6. Remover dados sensíveis do usuário
    const { password: _, ...userSafe } = user;

    // 7. Enviar resposta SEM tokens sensíveis no JSON
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      },
      sessionId: session.id // Apenas o ID da sessão
    });

    // 8. Log da sessão
    console.log(`✅ Nova sessão criada: ID ${session.id} para usuário ${user.id} (${user.email})`);
    console.log(`🍪 Cookies definidos para sessão ${session.id}`);

  } catch (error) {
    // Em caso de erro, garantir que nenhuma sessão ou token fique pendurado
    console.error('❌ Erro no login:', error);

    // Tentar limpar qualquer sessão que possa ter sido criada
    if (session?.id) {
      await prisma.session.delete({
        where: { id: session.id }
      }).catch(console.error);
    }

    // Limpar cookies em caso de erro
    res.clearCookie('accessToken', getCookieOptions(0));
    res.clearCookie('refreshToken', getCookieOptions(0));
    res.clearCookie('sessionId', { ...getCookieOptions(0), httpOnly: false });

    res.status(500).json({ 
      error: 'Erro ao processar login',
      message: 'Por favor, tente novamente'
    });
  }
});