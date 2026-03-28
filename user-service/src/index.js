const express    = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi  = require('swagger-ui-express');
const { initDB } = require('./db');
const usersRouter= require('./routes/users');
const logger     = require('./logger');

const app = express();
app.use(express.json());

// Log chaque requête entrante
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const lvl = res.statusCode >= 400 ? 'warn' : 'info';
    logger[lvl](`[REQ] ${req.method} ${req.url} → ${res.statusCode} (${Date.now()-start}ms)`);
  });
  next();
});

const swaggerSpec = swaggerJsdoc({
  definition: { openapi: '3.0.0', info: { title: 'User Service API', version: '1.0.0' } },
  apis: ['./src/routes/*.js'],
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/users', usersRouter);
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'user-service' }));

app.use((err, req, res, next) => {
  logger.error(`[ERREUR] ${err.message}`);
  res.status(500).json({ error: 'Erreur interne' });
});

const PORT = process.env.PORT || 3001;
initDB()
  .then(() => app.listen(PORT, () => logger.info(`User service démarré sur :${PORT}`)))
  .catch(e => { logger.error(`Init DB: ${e.message}`); process.exit(1); });

module.exports = app;
