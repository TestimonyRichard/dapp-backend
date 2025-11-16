// backend/index.js
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { sendTelegramMessage } from './telegram.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);
const FRONTEND_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000').split(',');

// Basic middleware
app.use(helmet());
app.use(express.json({ limit: '200kb' }));
app.use(morgan('dev'));
app.use(
  cors({
    origin: (origin, cb) => {
      // allow no-origin (server-to-server) or if matches configured origins
      if (!origin) return cb(null, true);
      if (FRONTEND_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked origin: ${origin}`));
    },
    methods: 'GET,POST,OPTIONS',
  })
);

// Rate limiter
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: Number(process.env.RATE_LIMIT_MAX || 120),
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// health
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// small helper to avoid injecting HTML breaks
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/>/g, '&gt;')
    .replace(/</g, '&lt;');
}

// Helper: ensure Telegram env present before sending
function requireTelegramConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in env');
  return { token, chatId };
}

// ----------------- Support form route -----------------
app.post('/support', async (req, res) => {
  try {
    const { name, email, walletAddress, issue } = req.body || {};

    // at least one identifying field must be present
    if (!name && !email && !walletAddress) {
      return res.status(400).json({ ok: false, error: 'Provide at least one of name, email or walletAddress' });
    }

    const { token, chatId } = requireTelegramConfig();

    const parts = [
      '<b>Support Request 📩</b>',
      name ? `Name: <b>${escapeHtml(name)}</b>` : null,
      email ? `Email: <code>${escapeHtml(email)}</code>` : null,
      walletAddress ? `Wallet: <code>${escapeHtml(walletAddress)}</code>` : null,
      issue ? `Issue: ${escapeHtml(issue)}` : null,
      `Time: ${new Date().toISOString()}`,
      `Source: ${escapeHtml(req.headers['user-agent'] || 'unknown')}`,
    ].filter(Boolean);

    const text = parts.join('\n');

    await sendTelegramMessage({ token, chatId, text });

    return res.json({ ok: true, message: 'Support request delivered' });
  } catch (err) {
    console.error('/support error:', err?.message || err);
    return res.status(500).json({ ok: false, error: 'server_error', detail: String(err?.message || err) });
  }
});

// ----------------- Wallet connect notification -----------------
app.post('/notify/wallet-connected', async (req, res) => {
  try {
    const { address, chainId, walletName, userAgent, ts } = req.body || {};

    if (!address) return res.status(400).json({ ok: false, error: 'address required' });

    const { token, chatId } = requireTelegramConfig();

    const lines = [
      '<b>Wallet Connected ✅</b>',
      walletName ? `Wallet: <b>${escapeHtml(walletName)}</b>` : null,
      `Address: <code>${escapeHtml(address)}</code>`,
      chainId ? `Chain ID: <code>${escapeHtml(chainId)}</code>` : null,
      ts ? `Time: ${escapeHtml(ts)}` : `Time: ${new Date().toISOString()}`,
      userAgent ? `UA: ${escapeHtml(userAgent)}` : null,
      `Source: ${escapeHtml(req.ip || req.headers['x-forwarded-for'] || 'unknown')}`,
    ].filter(Boolean);

    const text = lines.join('\n');

    await sendTelegramMessage({ token, chatId, text });

    return res.json({ ok: true, delivery: 'telegram_ok' });
  } catch (err) {
    console.error('/notify/wallet-connected error:', err?.message || err);
    return res.status(500).json({ ok: false, error: 'failed', detail: String(err?.message || err) });
  }
});

// global 404 handler for other methods/paths
app.all('*', (_req, res) => {
  res.status(404).json({ ok: false, error: 'not_found' });
});

// start server
const server = app.listen(PORT, () => {
  console.log(`✅ Backend API listening on port ${PORT}`);
});

// graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  server.close(() => process.exit(0));
});
