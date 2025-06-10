// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { logger } from './middlewares/logger.js';
import userRouter from './routes/userRouter.js';
import movieRouter from './routes/movieRouter.js';
import reviewRouter from './routes/reviewRouter.js';
import { errorHandler } from './middlewares/errorHandler.js';
import fileUpload from 'express-fileupload';

const app = express();

// Configurações de ambiente
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5500';
const PORT = process.env.PORT || 3000;

// Configuração CORS atualizada
app.use(cors({
  origin: [FRONTEND_URL, 'http://127.0.0.1:5500'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Refresh-Token',
    'X-Session-Id',
    'X-New-Access-Token',
    'User-Agent'
  ],
  exposedHeaders: [
    'Authorization',
    'X-New-Access-Token'
  ]
}));

// Aumentar limite do payload para suportar uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger
app.use(logger);

// Middleware para debug em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log('-------------------');
    console.log('Request Details:');
    console.log('URL:', req.url);
    console.log('Method:', req.method);
    console.log('Origin:', req.get('origin'));
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    console.log('-------------------');
    next();
  });
}

// Configurar middleware de upload
app.use(fileUpload({
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  abortOnLimit: true,
  debug: process.env.NODE_ENV !== 'production'
}));

// Headers de segurança
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Adicionar header Access-Control-Max-Age para cache de preflight
  res.setHeader('Access-Control-Max-Age', '86400');
  next();
});

// Preflight OPTIONS com configurações completas
app.options('*', cors({
  origin: [FRONTEND_URL, 'http://127.0.0.1:5500'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Refresh-Token',
    'X-Session-Id',
    'X-New-Access-Token',
    'User-Agent'
  ],
  exposedHeaders: [
    'Authorization',
    'X-New-Access-Token'
  ],
  maxAge: 86400
}));

// Rotas da API
app.use('/api/users', userRouter);
app.use('/api/movies', movieRouter);
app.use('/api/reviews', reviewRouter);

// Rota de teste/health check
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API CineLog funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling para rotas não encontradas
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'A rota solicitada não existe'
  });
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log('-----------------------------');
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('-----------------------------');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default app;