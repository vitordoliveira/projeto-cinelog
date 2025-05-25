import { z } from 'zod';

export const reviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, 'Avaliação mínima: 1 estrela')
    .max(5, 'Avaliação máxima: 5 estrelas'),
  comment: z
    .string()
    .min(1, 'Comentário não pode estar vazio')
    .max(1200, 'Comentário muito longo (máx. 1200 caracteres)')
});