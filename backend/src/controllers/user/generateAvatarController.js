import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

const prisma = new PrismaClient();

// Controller para gerar avatar baseado no nome do usuário
export default asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Obter dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Gerar URL de avatar usando serviço UI Avatars
    const encodedName = encodeURIComponent(user.name);
    const backgroundColor = '2c3440'; // Fundo escuro
    const color = 'ffffff'; // Texto branco
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodedName}&background=${backgroundColor}&color=${color}&size=200`;
    
    // Atualizar usuário no banco de dados
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl }
    });
    
    // Remover a senha antes de enviar a resposta
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.status(200).json({ 
      message: 'Avatar gerado com sucesso',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Erro ao gerar avatar:', error);
    res.status(500).json({ error: 'Erro ao gerar avatar' });
  }
});