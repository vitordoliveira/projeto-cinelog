// controllers/user/getUserMeController.js
import { getUserById } from '../../models/userModel.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

export default asyncHandler(async (req, res) => {
  try {
    // Acessa o ID do usuário a partir do objeto user anexado pelo middleware
    const user = await getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // O problema está aqui - precisamos modificar o getUserById no userModel.js
    // para incluir o campo avatarUrl na seleção
    console.log('Enviando dados do usuário para /me:', {
      ...user,
      hasAvatar: !!user.avatarUrl
    });

    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
});