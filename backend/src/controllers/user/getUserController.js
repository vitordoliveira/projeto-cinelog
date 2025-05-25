// controllers/user/getUserController.js
import { getUserById } from '../../models/userModel.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

export default asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const user = await getUserById(id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user);
});