import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { updateReview } from '../../models/reviewModel.js';

const updateReviewController = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const data = req.body;
  const updated = await updateReview(id, data);
  res.json({ message: 'Avaliação atualizada!', review: updated });
});

export default updateReviewController;
