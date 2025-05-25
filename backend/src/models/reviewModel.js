import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Mantive todas suas implementações originais, apenas adicionei melhorias de segurança
export const createReview = async (data) => {
  // Verificação extra de existência do filme e usuário
  const [movieExists, userExists] = await Promise.all([
    prisma.movie.findUnique({ where: { id: data.movieId } }),
    prisma.user.findUnique({ where: { id: data.userId } })
  ]);

  if (!movieExists || !userExists) {
    throw new Error('Filme ou usuário não encontrado');
  }

  // Em createReview - CORRIGIDO
  return await prisma.review.create({
    data: {
      rating: data.rating,
      comment: data.comment,
      movieId: data.movieId,
      userId: data.userId
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },  // CORRIGIDO
      movie: { select: { title: true } }
    }
  });
};

export const getReviewsByMovie = async (movieId) => {
  return await prisma.review.findMany({
    where: { movieId: Number(movieId) },
    include: {
      user: { 
        select: { 
          id: true, 
          name: true, 
          email: true,
          avatarUrl: true  // Adicionar o campo avatar aqui
        } 
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const updateReview = async (reviewId, data) => {
  return await prisma.review.update({
    where: { id: Number(reviewId) },
    data: {
      rating: data.rating,
      comment: data.comment
    },
    include: { 
      user: { 
        select: { 
          id: true, 
          name: true, 
          email: true, 
          avatarUrl: true  // Adicionar o campo avatar aqui
        } 
      } 
    }
  });
};

export async function deleteReview(reviewId) {
  // Converter para número para garantir que é um inteiro
  const id = parseInt(reviewId, 10);
  
  // Verificar se é um número válido
  if (isNaN(id)) {
    throw new Error('ID da avaliação inválido');
  }
  
  console.log(`Excluindo review com ID: ${id} (tipo: ${typeof id})`);
  
  // Prisma espera um objeto where com o ID como número inteiro
  return await prisma.review.delete({
    where: {
      id: id  // Certificar-se de que é um número inteiro
    }
  });
}

export async function getReviewsByUserId(userId) {
  return prisma.review.findMany({
    where: {
      userId: Number(userId)
    },
    orderBy: {
      createdAt: 'desc'  // Ordenar do mais recente para o mais antigo
    }
  });
}