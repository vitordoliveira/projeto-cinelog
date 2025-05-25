// controllers/user/updateUserController.js
import { updateUser } from '../../models/userModel.js';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

export default asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const data = req.body;

  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const updated = await updateUser(id, data);
  res.json({ message: 'Usuário atualizado!', user: updated });
});