import { getReviewsByUserId } from '../../models/reviewModel.js';
import { getMovieById } from '../../models/movieModel.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

export default asyncHandler(async (req, res) => {
  try {
    // Obter o ID do usuário do objeto req.user (definido pelo middleware de autenticação)
    const userId = req.user.id;
    
    // Buscar as avaliações do usuário
    const reviews = await getReviewsByUserId(userId);
    
    if (!reviews || reviews.length === 0) {
      return res.json([]);
    }
    
    // Buscar informações dos filmes para cada avaliação
    const reviewsWithMovies = await Promise.all(
      reviews.map(async (review) => {
        const movie = await getMovieById(review.movieId);
        
        return {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          movie: movie ? {
            id: movie.id,
            title: movie.title,
            imageUrl: movie.imageUrl
          } : null
        };
      })
    );
    
    res.json(reviewsWithMovies);
  } catch (error) {
    console.error('Erro ao buscar avaliações do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar avaliações do usuário' });
  }
});