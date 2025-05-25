// controllers/movie/adminMovieController.js
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função para obter estatísticas de filmes para administradores
export const getMovieStats = asyncHandler(async (req, res) => {
  try {
    // Contagem total de filmes
    const totalMovies = await prisma.movie.count();
    
    let topGenre = 'N/A';
    let topGenreCount = 0;
    let topRatedMovie = null;

    // Método alternativo para encontrar o gênero mais popular
    if (totalMovies > 0) {
      // Buscar todos os filmes para analisar gêneros
      const allMovies = await prisma.movie.findMany({
        select: {
          genre: true
        }
      });
      
      // Contar manualmente a frequência de cada gênero
      const genreCounts = {};
      allMovies.forEach(movie => {
        if (movie.genre) {
          if (!genreCounts[movie.genre]) {
            genreCounts[movie.genre] = 0;
          }
          genreCounts[movie.genre]++;
        }
      });
      
      // Encontrar o gênero mais frequente
      let maxCount = 0;
      Object.entries(genreCounts).forEach(([genre, count]) => {
        if (count > maxCount) {
          topGenre = genre;
          topGenreCount = count;
          maxCount = count;
        }
      });
    }

    // Filme melhor avaliado (apenas se houver avaliações)
    try {
      const reviewsExist = await prisma.review.count() > 0;
      
      if (reviewsExist) {
        // Buscar filmes com avaliações e calcular média
        const moviesWithReviews = await prisma.movie.findMany({
          where: {
            reviews: {
              some: {}
            }
          },
          select: {
            id: true,
            title: true,
            reviews: {
              select: {
                rating: true
              }
            }
          }
        });

        if (moviesWithReviews.length > 0) {
          // Calcular média para cada filme
          const moviesWithRatings = moviesWithReviews.map(movie => {
            const totalRating = movie.reviews.reduce((sum, review) => sum + review.rating, 0);
            const avgRating = movie.reviews.length > 0 ? totalRating / movie.reviews.length : 0;
            
            return {
              id: movie.id,
              title: movie.title,
              rating: avgRating
            };
          });
          
          // Ordenar por classificação (maior primeiro)
          moviesWithRatings.sort((a, b) => b.rating - a.rating);
          
          if (moviesWithRatings.length > 0) {
            topRatedMovie = moviesWithRatings[0];
          }
        }
      }
    } catch (ratingError) {
      console.error('Erro ao buscar filme melhor avaliado:', ratingError);
    }

    // Montar resposta com valores padrão para dados que não puderam ser obtidos
    const response = {
      totalMovies,
      topGenre,
      topGenreCount,
      topRatedMovie
    };

    console.log('Resposta de estatísticas de filmes:', response);
    res.json(response);
  } catch (error) {
    console.error('Erro ao obter estatísticas de filmes:', error);
    res.status(500).json({ 
      error: 'Erro ao obter estatísticas de filmes', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Função para obter a lista completa de filmes para administradores
export const getMoviesList = asyncHandler(async (req, res) => {
  try {
    const movies = await prisma.movie.findMany({
      include: {
        addedBy: {
          select: {
            id: true,
            name: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calcular a classificação média para cada filme
    const moviesWithRating = movies.map(movie => {
      const totalRating = movie.reviews.reduce((sum, review) => sum + review.rating, 0);
      const avgRating = movie.reviews.length > 0 ? totalRating / movie.reviews.length : 0;
      
      return {
        ...movie,
        averageRating: avgRating
      };
    });

    res.json(moviesWithRating);
  } catch (error) {
    console.error('Erro ao obter lista de filmes:', error);
    res.status(500).json({ error: 'Erro ao obter lista de filmes' });
  }
});