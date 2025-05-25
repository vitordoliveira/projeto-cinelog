// scripts/create-admin.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Substitua por um email de um usuário existente em seu sistema
    const emailDoUsuario = 'vitinzor2@gmail.com';  // Altere para o email correto

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email: emailDoUsuario }
    });

    if (!user) {
      console.log(`Usuário com email ${emailDoUsuario} não encontrado.`);
      return;
    }

    // Atualizar para admin
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' }
    });

    console.log(`Usuário ${updatedUser.name} (${updatedUser.email}) foi promovido para ADMIN com sucesso!`);
  } catch (error) {
    console.error('Erro ao promover usuário para admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a função
createAdmin();