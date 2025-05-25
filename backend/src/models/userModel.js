// models/userModel.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function createUser(data) {
  return prisma.user.create({ data });
}

export async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,  // Adicionamos este campo para retornar a URL do avatar
      createdAt: true,  // Útil para mostrar "membro desde"
      // você pode incluir mais campos se quiser retornar no /me
    },
  });
}

export async function getUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function getAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,  // Incluir avatar também na listagem de usuários
      // adicione mais campos se desejar
    },
  });
}

export async function updateUser(id, data) {
  return prisma.user.update({
    where: { id },
    data,
  });
}

export async function deleteUser(id) {
  return prisma.user.delete({
    where: { id },
  });
}