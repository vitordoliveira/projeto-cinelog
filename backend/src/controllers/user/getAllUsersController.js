// controllers/user/getAllUsersController.js
import { getAllUsers } from '../../models/userModel.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

export default asyncHandler(async (req, res) => {
  const users = await getAllUsers();
  res.json(users);
});