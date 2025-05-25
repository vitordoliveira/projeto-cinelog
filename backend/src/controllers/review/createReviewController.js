// controllers/user/createReviewController.js
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { createReview } from '../../models/reviewModel.js';
import { reviewSchema } from '../../schemas/reviewSchemas.js';

const createReviewController = asyncHandler(async (req, res) => {
  // 1. Validar apenas o corpo da requisição (rating e comment) usando o schema Zod
  const validatedBody = reviewSchema.parse(req.body);

  // 2. Obter o movieId dos parâmetros da rota e o userId do objeto req.user (setado pelo authMiddleware)
  const movieId = parseInt(req.params.movieId);
  // CORRIGIDO: Acessar o ID do usuário de req.user
  const userId = req.user.id;

  // Opcional: Adicionar uma verificação básica se o movieId parseado é um número válido
  if (isNaN(movieId)) {
      return res.status(400).json({ error: 'ID do filme inválido na URL.' });
  }

  // 3. Combinar os dados validados com os IDs para criar o objeto de dados para o modelo
  const reviewData = {
    rating: validatedBody.rating,
    comment: validatedBody.comment,
    movieId: movieId, // Usar o movieId obtido dos params
    userId: userId // Usar o userId obtido de req.user
  };

  // 4. Chamar a função do modelo com os dados completos e corretos
  const review = await createReview(reviewData);

  // Resposta mantendo seu formato original + novo redirect
  res.status(201).json({
    message: 'Avaliação criada!',
    redirect: `/movie-detail.html?id=${reviewData.movieId}`,
    review
  });
});

export default createReviewController;