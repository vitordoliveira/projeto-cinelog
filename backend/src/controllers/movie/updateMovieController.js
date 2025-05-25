import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { updateMovie } from '../../models/movieModel.js';

const updateMovieController = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const data = req.body;
  const updated = await updateMovie(id, data);
  res.json({ message: 'Filme atualizado com sucesso!', movie: updated });
});

export default updateMovieController;
