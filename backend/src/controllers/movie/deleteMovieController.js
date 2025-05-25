// src/controllers/movie/deleteMovieController.js
import { deleteMovie, getMovieById, deleteReviewsByMovieId } from '../../models/movieModel.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

export default asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  
  // Verificar se o filme existe
  const movie = await getMovieById(id);
  
  if (!movie) {
    return res.status(404).json({ error: 'Filme não encontrado' });
  }

  // Verificar permissões (considerando que req.user.id pode ser undefined se não for autenticado)
  // Mantendo a verificação original com adaptações para casos de administrador
  const isAdmin = req.user && req.user.role === 'ADMIN';
  const isOwner = movie.userId === req.user?.id || movie.addedBy?.id === req.user?.id;
  
  if (!isAdmin && !isOwner) {
    return res.status(403).json({ error: 'Acesso não autorizado' });
  }

  try {
    // Primeiro excluir todas as avaliações associadas ao filme
    console.log(`Excluindo avaliações do filme ID ${id}...`);
    await deleteReviewsByMovieId(id);
    
    // Depois excluir o filme
    console.log(`Excluindo filme ID ${id}...`);
    await deleteMovie(id);
    
    // Responder com sucesso
    return res.status(200).json({ message: 'Filme e suas avaliações excluídos com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir filme:', error);
    return res.status(500).json({ 
      error: `Erro ao excluir filme: ${error.message}`,
      details: error.code || 'unknown' 
    });
  }
});