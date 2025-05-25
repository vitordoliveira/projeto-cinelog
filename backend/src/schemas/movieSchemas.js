import { z } from 'zod';

// Schema atualizado para incluir gênero e diretor
export const movieSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  releaseYear: z.number().int().gte(1888),
  imageUrl: z.string().url().optional(),
  genre: z.string().optional(),
  director: z.string().optional() // Novo campo para diretor
});

// Schema para validação de upload
export const imageSchema = z.object({
  image: z
    .instanceof(File)
    .refine(file => file.type.startsWith('image/'), 'Formato inválido (use: JPG, PNG, etc.)')
    .refine(file => file.size <= 5 * 1024 * 1024, 'Tamanho máximo: 5MB')
});