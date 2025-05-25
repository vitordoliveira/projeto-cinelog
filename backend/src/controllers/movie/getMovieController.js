// src/controllers/movie/getMovieController.js
import { asyncHandler } from '../../middlewares/asyncHandler.js';
// Importe diretamente o prisma do módulo movieModel
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// src/controllers/movie/getMovieController.js
export const getMovieController = async (req, res, next) => {
  const { id } = req.params;
  try {
    const movie = await prisma.movie.findUnique({
      where: { id: Number(id) },
      include: {
        addedBy: true,                        // ← autor do filme (usando addedBy em vez de user)
        reviews: {
          include: { user: true }          // ← para já trazer nome/avatar na listagem de reviews
        }
      }
    });
    if (!movie) return res.status(404).json({ message: 'Filme não encontrado' });
    res.json(movie);
  } catch (err) {
    next(err);
  }
};

export default getMovieController;