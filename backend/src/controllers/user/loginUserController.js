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

  try {
    // 1. Revogar sessões antigas do mesmo dispositivo
    await revokeOldSessions(user.id, req.headers['user-agent']);

    // 2. Criar nova sessão
    const session = await createSession(user.id, req);

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

    // 5. Remover dados sensíveis do usuário
    const { password: _, ...userSafe } = user;

    // 6. Enviar resposta com tokens e dados do usuário
    res.json({
      accessToken,
      refreshToken,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      sessionId: session.id,
      ...userSafe
    });

    // 7. Log da sessão (opcional)
    console.log(`Nova sessão criada: ID ${session.id} para usuário ${user.id}`);

  } catch (error) {
    // Em caso de erro, garantir que nenhuma sessão ou token fique pendurado
    console.error('Erro no login:', error);

    // Tentar limpar qualquer sessão que possa ter sido criada
    if (session?.id) {
      await prisma.session.delete({
        where: { id: session.id }
      }).catch(console.error);
    }

    res.status(500).json({ 
      error: 'Erro ao processar login',
      message: 'Por favor, tente novamente'
    });
  }
});