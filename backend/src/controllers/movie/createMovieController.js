// controllers/movie/createMovieController.js
import { createMovie } from '../../models/movieModel.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
// Possivelmente você terá um schema Zod para validação aqui também,
// mas vamos focar na passagem do userId por enquanto.

export default asyncHandler(async (req, res) => {
  // O middleware 'auth' anexa o usuário logado em req.user
  // Certifique-se de que este controlador está usando o middleware 'auth' na rota.
  const userId = req.user.id; // Obtém o ID do usuário logado

  // Combina os dados do corpo da requisição com o userId
  const movieData = {
    ...req.body,
    addedByUserId: userId // Inclui o userId do usuário logado
  };

  // Chama a função do modelo passando os dados completos
  const movie = await createMovie(movieData);

  res.status(201).json({ movie });
});