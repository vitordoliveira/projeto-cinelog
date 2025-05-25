// src/models/movieModel.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// A função agora espera receber um objeto 'data' que inclui addedByUserId, genre e director
export async function createMovie(data) {
  return prisma.movie.create({
    data: {
      // Inclui os campos diretos do filme
      title: data.title,
      description: data.description,
      releaseYear: data.releaseYear,
      imageUrl: data.imageUrl,
      genre: data.genre,
      director: data.director, // Novo campo de diretor

      // Conecta o filme ao usuário que o adicionou
      addedBy: {
        connect: {
          id: data.addedByUserId
        }
      }
    }
  });
}

export async function getMovieById(id) {
  return prisma.movie.findUnique({ 
    where: { id: Number(id) },
    include: {
      addedBy: true,                     // ← autor do filme
      reviews: {
        include: { user: true }          // ← para já trazer nome/avatar na listagem de reviews
      }
    }
  });
}

export async function getAllMovies() {
  return prisma.movie.findMany({
    // Incluir a relação 'addedBy' e selecionar os campos do usuário
    include: {
      addedBy: {
        select: {
          id: true,
          name: true, // Incluir o nome do usuário
          // Adicione outros campos do usuário aqui se precisar (ex: email, mas cuidado com dados sensíveis)
        }
      }
    }
  });
}

export async function updateMovie(id, data) {
  return prisma.movie.update({ where: { id }, data });
}

export async function deleteMovie(id) {
  return prisma.movie.delete({ where: { id } });
}

export async function getMoviesByUserId(userId) {
  return prisma.movie.findMany({
    where: {
      userId: Number(userId)
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export const deleteReviewsByMovieId = async (movieId) => {
  try {
    return await prisma.review.deleteMany({
      where: { movieId: Number(movieId) }
    });
  } catch (error) {
    console.error(`Erro ao excluir avaliações do filme ${movieId}:`, error);
    throw error;
  }
};