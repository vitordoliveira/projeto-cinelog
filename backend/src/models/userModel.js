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
      role: true,      // ← ADICIONAR ESTE CAMPO!
      avatarUrl: true,
      createdAt: true,
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
      role: true,      // ← ADICIONAR AQUI TAMBÉM!
      avatarUrl: true,
      _count: {        // ← ÚTIL PARA ADMIN
        reviews: true,
        addedMovies: true
      }
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