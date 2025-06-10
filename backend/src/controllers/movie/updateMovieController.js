import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { updateMovie, getMovieById } from '../../models/movieModel.js';

const updateMovieController = asyncHandler(async (req, res) => {
  try {
    console.log('🔄 [Update] Iniciando atualização do filme...');
    
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      console.log('❌ [Update] ID inválido:', req.params.id);
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // 1. Verificar se filme existe
    console.log('🔍 [Update] Buscando filme:', id);
    const movie = await getMovieById(id);
    
    if (!movie) {
      console.log('❌ [Update] Filme não encontrado');
      return res.status(404).json({ error: 'Filme não encontrado' });
    }
    
    // 2. Verificar permissões
    const isAdmin = req.user?.role === 'ADMIN';
    const isOwner = movie.addedBy?.id === req.user?.id;
    
    console.log('🔐 [Update] Verificando permissões:', {
      isAdmin,
      isOwner,
      userId: req.user?.id,
      movieOwner: movie.addedBy?.id
    });
    
    if (!isAdmin && !isOwner) {
      console.log('⛔ [Update] Acesso não autorizado');
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }
    
    // 3. Preparar dados para atualização
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      releaseYear: Number(req.body.releaseYear),
      director: req.body.director,
      genre: req.body.genre,
      imageUrl: req.body.imageUrl
    };

    console.log('📝 [Update] Dados para atualização:', updateData);
    
    // 4. Atualizar
    const updated = await updateMovie(id, updateData);
    
    if (!updated) {
      console.log('❌ [Update] Erro ao atualizar filme');
      return res.status(500).json({ error: 'Erro ao atualizar filme' });
    }
    
    console.log('✅ [Update] Filme atualizado com sucesso:', updated);
    
    res.json({ 
      message: 'Filme atualizado com sucesso!', 
      movie: updated 
    });
    
  } catch (error) {
    console.error('❌ [Update] Erro:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar filme',
      message: error.message 
    });
  }
});

export default updateMovieController;