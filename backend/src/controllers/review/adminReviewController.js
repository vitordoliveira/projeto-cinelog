// controllers/review/adminReviewController.js
import { deleteReview } from '../../models/reviewModel.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função para administradores excluírem qualquer avaliação
export const deleteReviewAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    // Usar a função do modelo existente
    await deleteReview(id);
    
    res.json({ 
      message: 'Avaliação excluída com sucesso pelo administrador'
    });
  } catch (error) {
    console.error('Erro ao excluir avaliação:', error);
    res.status(error.message.includes('não encontrada') ? 404 : 500)
      .json({ error: error.message || 'Erro ao excluir avaliação' });
  }
});

// Função para obter estatísticas de avaliações para administradores
export const getReviewStats = asyncHandler(async (req, res) => {
  try {
    // Contagem total de avaliações
    const totalReviews = await prisma.review.count();

    // Média de avaliações
    const avgRatingResult = await prisma.review.aggregate({
      _avg: { rating: true }
    });
    const averageRating = avgRatingResult._avg.rating || 0;

    // Distribuição de avaliações por classificação
    const ratingDistribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };

    const ratingCounts = await prisma.review.groupBy({
      by: ['rating'],
      _count: { _all: true }
    });

    ratingCounts.forEach(item => {
      if (item.rating >= 1 && item.rating <= 5) {
        ratingDistribution[item.rating] = item._count._all;
      }
    });

    // Filme mais avaliado
    const mostReviewedMovies = await prisma.movie.findMany({
      select: {
        id: true,
        title: true,
        _count: {
          select: { reviews: true }
        }
      },
      orderBy: {
        reviews: { _count: 'desc' }
      },
      take: 1
    });

    const mostReviewedMovie = mostReviewedMovies.length > 0 
      ? { 
          title: mostReviewedMovies[0].title, 
          count: mostReviewedMovies[0]._count.reviews 
        } 
      : null;

    res.json({
      totalReviews,
      averageRating,
      ratingDistribution,
      mostReviewedMovie
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de avaliações:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas de avaliações' });
  }
});

// Função para listar todas as avaliações para administradores
export const listAllReviews = asyncHandler(async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            imageUrl: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(reviews);
  } catch (error) {
    console.error('Erro ao listar avaliações:', error);
    res.status(500).json({ error: 'Erro ao listar avaliações' });
  }
});