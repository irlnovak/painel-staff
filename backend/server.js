// =================================================
// F4TE STAFF PANEL - Servidor Express
// Criado por f4te
// =================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { testConnection } = require('./config/db');

const authRoutes    = require('./routes/auth');
const actionRoutes  = require('./routes/actions');
const eventRoutes   = require('./routes/events');
const paymentRoutes = require('./routes/payments');
const userRoutes    = require('./routes/users');

const app = express();

// Segurança base
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '256kb' }));

// Rate limit para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' }
});

// Servir frontend estático
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Rotas API
app.use('/api/auth',     loginLimiter, authRoutes);
app.use('/api/actions',  actionRoutes);
app.use('/api/events',   eventRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users',    userRoutes);

// Healthcheck
app.get('/api/health', async (req, res) => {
  const db = await testConnection();
  res.json({ status: 'ok', db, uptime: process.uptime() });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Error handler final
app.use((err, req, res, next) => {
  console.error('[ERRO]', err);
  res.status(err.statusCode || 500).json({
    error: err.expose ? err.message : 'Erro interno do servidor'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`\n  ╔═══════════════════════════════════════╗`);
  console.log(`  ║   F4TE STAFF PANEL - ONLINE           ║`);
  console.log(`  ║   Porta: ${PORT}                        ║`);
  console.log(`  ║   Criado por f4te                     ║`);
  console.log(`  ╚═══════════════════════════════════════╝\n`);
  await testConnection();
});
