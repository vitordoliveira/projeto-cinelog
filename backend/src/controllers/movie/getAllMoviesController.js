// src/controllers/movie/getAllMoviesController.js
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const getAllMoviesController = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip  = (page - 1) * limit;

  const [movies, total] = await Promise.all([
    prisma.movie.findMany({
      skip,
      take: limit,
      include: {
        addedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    }),
    prisma.movie.count()
  ]);

  res.json({
    movies,
    totalPages: Math.ceil(total / limit)
  });
});

export default getAllMoviesController;
