import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { uploadImage } from '../../services/cloudinaryService.js';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

export default asyncHandler(async (req, res) => {
  // Mudamos para usar 'avatar' ao invés de 'image'
  if (!req.files?.avatar) {
    return res.status(400).json({ error: "Nenhum arquivo enviado" });
  }

  const file = req.files.avatar;
  const userId = req.user.id;
  
  // 1. Criar pasta temporária
  const tempDir = path.join(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // 2. Salvar arquivo temporariamente
  const tempPath = path.join(tempDir, file.name);
  await file.mv(tempPath);

  try {
    // 3. Fazer upload para Cloudinary com pasta específica para avatares
    const result = await uploadImage(tempPath, 'avatars');
    
    // 4. Atualizar usuário com a nova URL do Cloudinary
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

    // 5. Limpar arquivo temporário
    fs.unlinkSync(tempPath);

    res.json({ 
      message: 'Avatar atualizado com sucesso',
      user: updatedUser
    });
  } catch (error) {
    // 6. Garantir limpeza em caso de erro
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    console.error('Erro ao atualizar avatar:', error);
    res.status(500).json({ 
      error: "Falha no upload do avatar",
      details: error.message
    });
  }
});