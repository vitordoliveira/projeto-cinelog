import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Verificar variáveis de ambiente obrigatórias
const requiredEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Variável de ambiente ${envVar} não configurada`);
  }
});

// Configurar o Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Faz upload de uma imagem para o Cloudinary
 * @param {Buffer} fileBuffer - Buffer do arquivo
 * @param {string} folder - Pasta opcional no Cloudinary
 * @returns {Promise<Object>} Resultado do upload
 */
export const uploadImage = async (fileBuffer, folder = '') => {
  try {
    console.log('📤 [Cloudinary] Iniciando upload...');

    const options = {
      use_filename: true,
      unique_filename: true,
      overwrite: true,
      resource_type: 'auto',
      formats: ['jpg', 'png', 'webp'],
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    };
    
    if (folder) {
      options.folder = folder;
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            console.error('❌ [Cloudinary] Erro no upload:', error);
            reject(error);
          } else {
            console.log('✅ [Cloudinary] Upload bem-sucedido:', result.secure_url);
            resolve(result);
          }
        }
      );

      uploadStream.end(fileBuffer);
    });

  } catch (error) {
    console.error('❌ [Cloudinary] Erro no upload:', error);
    throw new Error(`Erro no upload para Cloudinary: ${error.message}`);
  }
};

/**
 * Exclui uma imagem do Cloudinary
 * @param {string} publicId - ID público da imagem no Cloudinary
 * @returns {Promise<Object>} Resultado da exclusão
 */
export const deleteImage = async (publicId) => {
  try {
    console.log('🗑️ [Cloudinary] Excluindo imagem:', publicId);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('✅ [Cloudinary] Imagem excluída com sucesso');
    return result;
  } catch (error) {
    console.error('❌ [Cloudinary] Erro ao excluir imagem:', error);
    throw new Error(`Erro ao excluir imagem do Cloudinary: ${error.message}`);
  }
};

// Verificar conexão com o Cloudinary
cloudinary.api.ping()
  .then(() => console.log('✅ [Cloudinary] Conexão estabelecida'))
  .catch(error => console.error('❌ [Cloudinary] Erro na conexão:', error));

export default {
  uploadImage,
  deleteImage
};