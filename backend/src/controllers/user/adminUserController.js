// controllers/user/adminUserController.js
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

const prisma = new PrismaClient();

// Listar todos os usuários (para administradores)
export const listAllUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
      _count: {
        select: {
          reviews: true,
          addedMovies: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.json(users);
});

// Promover um usuário para ADMIN
export const promoteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  // Verificar se o usuário existe
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) }
  });
  
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  // Evitar que o usuário promova a si mesmo (segurança adicional)
  if (user.id === req.user.id) {
    return res.status(403).json({ 
      error: 'Você não pode alterar seu próprio status de administrador' 
    });
  }
  
  // Atualizar o role do usuário
  const updatedUser = await prisma.user.update({
    where: { id: Number(userId) },
    data: { role: 'ADMIN' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });
  
  res.json({
    message: `Usuário ${updatedUser.name} promovido para ADMIN com sucesso`,
    user: updatedUser
  });
});

// Rebaixar um usuário de ADMIN para USER
export const demoteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  // Verificar se o usuário existe
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) }
  });
  
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  // Evitar que o usuário rebaixe a si mesmo (segurança adicional)
  if (user.id === req.user.id) {
    return res.status(403).json({ 
      error: 'Você não pode alterar seu próprio status de administrador' 
    });
  }
  
  // Atualizar o role do usuário
  const updatedUser = await prisma.user.update({
    where: { id: Number(userId) },
    data: { role: 'USER' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });
  
  res.json({
    message: `Usuário ${updatedUser.name} rebaixado para USER com sucesso`,
    user: updatedUser
  });
});

// Deletar um usuário (apenas admins podem fazer isso)
export const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  // Verificar se o usuário existe
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) }
  });
  
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  // Impedir que o usuário exclua a si mesmo
  if (user.id === req.user.id) {
    return res.status(403).json({ 
      error: 'Você não pode excluir sua própria conta por aqui' 
    });
  }
  
  // Excluir o usuário
  await prisma.user.delete({
    where: { id: Number(userId) }
  });
  
  res.json({
    message: `Usuário ${user.name} excluído com sucesso`
  });
});