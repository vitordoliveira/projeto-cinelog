// controllers/user/uploadAvatarController.js
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { uploadImage } from '../../services/cloudinaryService.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

export default asyncHandler(async (req, res) => {
  try {
    // Verificar se há arquivo enviado
    if (!req.files || !req.files.avatar) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const avatarFile = req.files.avatar;
    console.log('Recebido arquivo:', avatarFile.name, 'tipo:', avatarFile.mimetype);

    // Verificar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(avatarFile.mimetype)) {
      return res.status(400).json({ error: 'Formato de imagem não suportado. Use JPEG, PNG ou GIF.' });
    }

    // Verificar tamanho do arquivo (5MB máximo)
    if (avatarFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Tamanho máximo permitido é 5MB' });
    }

    // 1. Criar pasta temporária se não existir
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 2. Salvar arquivo temporariamente
    const tempPath = path.join(tempDir, avatarFile.name);
    await avatarFile.mv(tempPath);

    try {
      // 3. Fazer upload para Cloudinary (com pasta específica para avatares)
      const result = await uploadImage(tempPath, 'cinelog/avatars');
      
      // 4. Limpar arquivo temporário
      fs.unlinkSync(tempPath);

      // 5. Atualizar usuário no banco de dados com URL do Cloudinary
      const avatarUrl = result.secure_url;
      
      console.log('Avatar enviado para Cloudinary. URL:', avatarUrl);
      
      // Atualizar usuário no banco de dados
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: { avatarUrl }
      });
      
      // Remover a senha antes de enviar a resposta
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json({ 
        message: 'Avatar atualizado com sucesso',
        user: userWithoutPassword
      });
    } catch (error) {
      // 6. Garantir limpeza em caso de erro
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      console.error('Erro no upload para Cloudinary:', error);
      res.status(500).json({ 
        error: "Falha no upload",
        details: error.message
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar avatar:', error);
    res.status(500).json({ error: 'Erro ao atualizar avatar no banco de dados' });
  }
});