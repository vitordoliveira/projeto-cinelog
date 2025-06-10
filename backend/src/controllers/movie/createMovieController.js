import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { createMovie } from '../../models/movieModel.js';

export default asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Verificar se há dados
  if (!req.body) {
    return res.status(400).json({ 
      error: 'Dados do filme não fornecidos' 
    });
  }

  // Garantir que releaseYear é um número
  const movieData = {
    ...req.body,
    releaseYear: parseInt(req.body.releaseYear),
    addedByUserId: userId
  };

  try {
    const movie = await createMovie(movieData);
    res.status(201).json({ 
      message: 'Filme criado com sucesso',
      movie 
    });
  } catch (error) {
    console.error('Erro ao criar filme:', error);
    res.status(500).json({ 
      error: 'Erro ao criar filme',
      details: error.message
    });
  }
});