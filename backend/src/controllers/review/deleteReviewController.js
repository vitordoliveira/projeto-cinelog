import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { deleteReview } from '../../models/reviewModel.js';

const deleteReviewController = asyncHandler(async (req, res) => {
  // CORRIGIDO: Usar req.params.reviewId em vez de req.params.id
  const reviewId = Number(req.params.reviewId);
  
  // Validar se é um número válido
  if (isNaN(reviewId)) {
    return res.status(400).json({ message: 'ID da avaliação inválido' });
  }
  
  console.log(`Controlador: Excluindo review com ID ${reviewId}`);
  
  await deleteReview(reviewId);
  res.status(204).send();
});

export default deleteReviewController;