export const validateUpload = (fieldName = 'image') => (req, res, next) => {
  console.log('🔍 ValidateUpload - Iniciando validação');
  console.log('📁 Files recebidos:', Object.keys(req.files || {}));

  if (!req.files || !req.files[fieldName]) {
    console.log(`❌ ValidateUpload - Nenhum arquivo ${fieldName} encontrado`);
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const file = req.files[fieldName];
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (!allowedTypes.includes(file.mimetype)) {
    console.log('❌ ValidateUpload - Tipo de arquivo inválido:', file.mimetype);
    return res.status(400).json({ 
      error: 'Formato de arquivo inválido. Use JPEG, PNG ou GIF' 
    });
  }

  if (file.size > 5 * 1024 * 1024) { // 5MB
    console.log('❌ ValidateUpload - Arquivo muito grande:', file.size);
    return res.status(400).json({ 
      error: 'Arquivo muito grande. Máximo de 5MB permitido' 
    });
  }

  console.log('✅ ValidateUpload - Arquivo válido');
  next();
};