import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './middlewares/logger.js';
import userRouter from './routes/userRouter.js';
import movieRouter from './routes/movieRouter.js';
import reviewRouter from './routes/reviewRouter.js';
import { errorHandler } from './middlewares/errorHandler.js';
import fileUpload from 'express-fileupload';
import cookieParser from 'cookie-parser'; // Nova importação

console.log('JWT_SECRET está definido?', !!process.env.JWT_SECRET);
console.log('JWT_REFRESH_SECRET está definido?', !!process.env.JWT_REFRESH_SECRET);
// Configurar __dirname em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('trust proxy', true);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5500', // Domínio do seu frontend
  credentials: true // Importante para cookies
}));
app.use(express.json());
app.use(cookieParser()); // Inicializa o cookie-parser
app.use(logger);

// Configurar middleware de upload
app.use(fileUpload({
  createParentPath: true, // Criar diretórios se não existirem
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  abortOnLimit: true
}));



// Adicionar ANTES das rotas da API
app.use('/uploads/avatars', express.static(path.join(__dirname, '../uploads/avatars')));
app.use('/uploads/posters', express.static(path.join(__dirname, '../uploads/posters')));

// Rotas
app.use('/users', userRouter);
app.use('/movies', movieRouter);
// Rota de reviews aninhada já é definida no movieRouter
// Definir rota de reviews diretamente para acesso admin
app.use('/reviews', reviewRouter);

// Rota de teste para verificar se o servidor está funcionando
app.get('/', (req, res) => {
  res.json({ message: 'API CineLog funcionando!' });
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));