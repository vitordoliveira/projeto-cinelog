export const validateUpload = (options = {}) => {
  return (req, res, next) => {
    if (!req.files || !req.files.image) { // Campo "image" deve existir
      return next(new ErrorHandler("Nenhum arquivo enviado", 400));
    }

    const image = req.files.image;
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB padrão
  
      // Verificar tipo de arquivo
      if (!allowedTypes.includes(image.mimetype)) {
        return next(new ErrorHandler("Formato de imagem inválido (use JPEG, PNG ou WEBP)", 400));
      }
  
      // Verificar tamanho
      if (image.size > maxSize) {
        return next(new ErrorHandler(`Imagem muito grande (máximo ${maxSize / 1024 / 1024}MB)`, 400));
      }
  
      next();
    };
  };