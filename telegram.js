// backend/telegram.js
import fetch from 'node-fetch';

/**
 * sendTelegramMessage({ token, chatId, text })
 * - token: bot token (string)
 * - chatId: chat id (string or number)
 * - text: message (string, supports HTML)
 */
export async function sendTelegramMessage({ token, chatId, text }) {
  if (!token || !chatId) {
    throw new Error('Missing telegram token or chatId');
  }
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: String(chatId), text, parse_mode: 'HTML' }),
      // optional: set timeout via AbortController if desired
    });
    const data = await res.json();
    if (!res.ok || data?.ok === false) {
      throw new Error(`Telegram API error: ${data?.description || res.status}`);
    }
    return data;
  } catch (err) {
    console.error('sendTelegramMessage error:', err?.message || err);
    throw err;
  }
}
export default sendTelegramMessage;
