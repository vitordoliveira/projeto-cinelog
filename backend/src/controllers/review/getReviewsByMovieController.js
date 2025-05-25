import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { getReviewsByMovie } from '../../models/reviewModel.js';

const getReviewsByMovieController = asyncHandler(async (req, res) => {
  const movieId = Number(req.params.movieId);
  const reviews = await getReviewsByMovie(movieId);
  
  // Adicione este log para verificar se o avatarUrl está vindo nos dados
  console.log("Exemplo da primeira review:", 
    reviews.length > 0 
      ? `ID: ${reviews[0].id}, User: ${reviews[0].user?.name || 'N/A'}, AvatarURL: ${reviews[0].user?.avatarUrl || 'VAZIO'}`
      : "Nenhuma review encontrada"
  );
  
  res.json(reviews);
});

export default getReviewsByMovieController;