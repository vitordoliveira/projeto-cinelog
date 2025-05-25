import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

const prisma = new PrismaClient();

export default asyncHandler(async (req, res) => {
  try {
    // Obter ID do usuário da requisição (definido pelo middleware de autenticação)
    const userId = req.user.id;
    
    // Buscar filmes adicionados pelo usuário
    const movies = await prisma.movie.findMany({
      where: {
        addedByUserId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Retornar a lista de filmes
    res.json(movies);
  } catch (error) {
    console.error('Erro ao buscar filmes do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar filmes do usuário' });
  }
});