import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { uploadImage } from '../../services/cloudinaryService.js';

export const uploadImageController = asyncHandler(async (req, res) => {
  try {
    console.log('🚀 [Upload] Iniciando processo de upload');
    
    if (!req.files?.image) {
      console.log('❌ [Upload] Nenhum arquivo recebido');
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const image = req.files.image;
    
    console.log('📝 [Upload] Dados do arquivo:', {
      name: image.name,
      type: image.mimetype,
      size: image.size
    });

    // Validação adicional do tipo de arquivo
    if (!image.mimetype.startsWith('image/')) {
      console.log('❌ [Upload] Tipo de arquivo inválido:', image.mimetype);
      return res.status(400).json({ 
        error: "Tipo de arquivo inválido",
        message: "Apenas imagens são permitidas"
      });
    }

    // Validação do tamanho do arquivo (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (image.size > maxSize) {
      console.log('❌ [Upload] Arquivo muito grande:', image.size);
      return res.status(400).json({ 
        error: "Arquivo muito grande",
        message: "O tamanho máximo permitido é 5MB"
      });
    }

    console.log('📤 [Upload] Enviando para Cloudinary...');

    // Upload direto para Cloudinary usando o buffer
    const result = await uploadImage(image.data);
    
    console.log('✅ [Upload] Upload concluído:', result.secure_url);

    res.json({ 
      url: result.secure_url,
      success: true
    });

  } catch (error) {
    console.error('❌ [Upload] Erro:', error);
    res.status(500).json({ 
      error: "Falha no upload",
      message: error.message,
      success: false
    });
  }
});