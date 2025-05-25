// controllers/user/createUserController.js
import { createUser } from '../../models/userModel.js';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

export default asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await createUser({ name, email, password: hashedPassword });
  res.status(201).json({ message: 'Usuário criado!', user });
});