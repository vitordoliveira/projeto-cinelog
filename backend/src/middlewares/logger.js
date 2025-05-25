// src/middlewares/logger.js
export const logger = (req, res, next) => {
  const startTime = Date.now();
  const { method, originalUrl, ip, headers } = req;
  
  // Captura o User-Agent
  const userAgent = headers['user-agent'] || 'Desconhecido';
  
  // Gera ID único para a requisição
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();

  // Log inicial
  console.log(
    `[${new Date().toISOString()}] [${requestId}] ${method} ${originalUrl} | ` +
    `IP: ${ip} | User-Agent: ${userAgent} | Início`
  );

  // Captura o término da resposta
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logMessage = 
      `[${new Date().toISOString()}] [${requestId}] ${method} ${originalUrl} | ` +
      `Status: ${res.statusCode} | Duração: ${duration}ms | ` +
      `IP: ${ip} | User-Agent: ${userAgent}`;

    // Log colorido baseado no status code
    if (res.statusCode >= 500) {
      console.error('\x1b[31m%s\x1b[0m', logMessage); // Vermelho para erros 5xx
    } else if (res.statusCode >= 400) {
      console.warn('\x1b[33m%s\x1b[0m', logMessage); // Amarelo para 4xx
    } else {
      console.log('\x1b[32m%s\x1b[0m', logMessage); // Verde para sucesso
    }
  });

  next();
};