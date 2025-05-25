// controllers/user/deleteUserController.js
import { deleteUser } from '../../models/userModel.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

// Adicione "export default"
export default asyncHandler(async (req, res) => {
  try {
    const id = Number(req.params.id);
    await deleteUser(id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});