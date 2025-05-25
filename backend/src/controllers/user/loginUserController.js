// No topo do seu loginUserController.js
import 'dotenv/config';
// controllers/user/loginUserController.js
import { getUserByEmail } from '../../models/userModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

// No início da função de login
console.log("Variáveis de ambiente:", {
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET
});

export default asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await getUserByEmail(email);
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // Gerar access token (curta duração)
  const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { 
    expiresIn: '15m' // Reduzir para 15 minutos
  });

  // Gerar refresh token (longa duração)
  const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, { 
      expiresIn: '7d' // 7 dias
  });

  // Armazenar refresh token em cookie HttpOnly
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,         // Não acessível via JavaScript
    secure: process.env.NODE_ENV === 'production', // HTTPS em produção
    sameSite: 'Strict',     // Proteção contra CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias em milissegundos
  });

  // Remove a senha e inclui todos os outros dados
  const { password: _, ...userSafe } = user;
  
  // Enviamos o access token e o usuário na resposta
  res.json({ 
    token: accessToken,  // Apenas o access token é enviado na resposta
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    ...userSafe 
  });
});