import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { uploadImage } from '../../services/cloudinaryService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const uploadImageController = asyncHandler(async (req, res) => {
  if (!req.files?.image) {
    return res.status(400).json({ error: "Nenhum arquivo enviado" });
  }

  const image = req.files.image;
  
  // 1. Criar pasta temporária se não existir
  const tempDir = path.join(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // 2. Salvar arquivo temporariamente
  const tempPath = path.join(tempDir, image.name);
  await image.mv(tempPath);

  try {
    // 3. Fazer upload para Cloudinary
    const result = await uploadImage(tempPath);
    
    // 4. Limpar arquivo temporário
    fs.unlinkSync(tempPath);

    res.json({ url: result.secure_url });
  } catch (error) {
    // 5. Garantir limpeza em caso de erro
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    res.status(500).json({ 
      error: "Falha no upload",
      details: error.message
    });
  }
});