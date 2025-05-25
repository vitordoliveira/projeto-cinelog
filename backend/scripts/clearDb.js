// clearDb.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('Limpando tabelas: Review, Movie, User...');

    // Usar DELETE FROM sem WHERE para excluir todos os registros
    // Executar na ordem que respeita as chaves estrangeiras (Review -> Movie, User)
    // Em alguns casos, pode ser necessário desabilitar FK checks temporariamente,
    // mas DELETE na ordem correta geralmente funciona.
    await prisma.$executeRawUnsafe('DELETE FROM Review;');
    console.log('Dados da tabela Review excluídos.');

    await prisma.$executeRawUnsafe('DELETE FROM Movie;');
    console.log('Dados da tabela Movie excluídos.');

    await prisma.$executeRawUnsafe('DELETE FROM User;');
    console.log('Dados da tabela User excluídos.');

    console.log('Banco de dados limpo com sucesso.');

  } catch (error) {
    console.error('Erro ao limpar o banco de dados:', error);
    // Se você desabilitou FK checks, é importante reabilitá-los mesmo em caso de erro
    // await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;').catch(e => console.error("Erro ao reabilitar FK checks", e));
  } finally {
    // Sempre desconectar o Prisma Client
    await prisma.$disconnect();
  }
}

// Executar a função de limpeza ao rodar o script
clearDatabase();