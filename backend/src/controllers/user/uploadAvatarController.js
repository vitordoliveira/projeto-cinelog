import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { uploadImage } from '../../services/cloudinaryService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default asyncHandler(async (req, res) => {
  if (!req.files?.avatar) {
    return res.status(400).json({ error: "Nenhum arquivo enviado" });
  }

  const file = req.files.avatar;
  const userId = req.user.id;

  try {
    // 1. Fazer upload direto para Cloudinary usando o buffer do arquivo
    const result = await uploadImage(file.data, 'avatars');
    
    // 2. Atualizar usuário com a nova URL do Cloudinary
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: result.secure_url },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    res.json({ 
      message: 'Avatar atualizado com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao atualizar avatar:', error);
    res.status(500).json({ 
      error: "Falha no upload do avatar",
      details: error.message
    });
  }
});