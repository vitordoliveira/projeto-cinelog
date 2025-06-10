// controllers/user/getSessionsController.js
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

const prisma = new PrismaClient();

export default asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const sessions = await prisma.session.findMany({
    where: {
      userId,
      isActive: true
    },
    orderBy: {
      lastActivity: 'desc'
    },
    select: {
      id: true,
      deviceInfo: true,
      ipAddress: true,
      userAgent: true,
      lastActivity: true,
      createdAt: true
    }
  });

  res.json(sessions);
});