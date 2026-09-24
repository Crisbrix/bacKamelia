const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

const origins = [
  env.clientOrigin,
  'https://la-kamelia.vercel.app',
  'https://lacamelia.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json({ limit: '100kb' }));

app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api')) {
      console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - started}ms)`);
    }
  });
  next();
});

app.get('/', (req, res) => {
  res.json({ ok: true, service: 'rancho-kamelia-api', docs: '/api/health' });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
