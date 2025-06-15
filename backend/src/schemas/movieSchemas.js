import { z } from 'zod';

export const movieSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  releaseYear: z
    .number()
    .int()
    .gte(1888, "O ano deve ser maior ou igual a 1888")
    .or(z.string().regex(/^\d+$/).transform(val => parseInt(val))), // Aceita string numérica
  imageUrl: z.string().url().nullable().optional(),
  genre: z.string().optional(),
  director: z.string().optional()
});

export const imageSchema = z.object({
  image: z
    .instanceof(File)
    .refine(file => file.type.startsWith('image/'), 'Formato inválido (use: JPG, PNG, etc.)')
    .refine(file => file.size <= 10 * 1024 * 1024, 'Tamanho máximo: 10MB')
});