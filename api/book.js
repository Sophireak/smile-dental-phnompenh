// Serverless Backend Function for Vercel
// Securely handles Telegram notifications without exposing tokens to the frontend

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, treatment, time, note } = req.body || {};

  // Basic validation
  if (!name || !phone || !treatment || !time) {
    return res.status(400).json({ error: 'Missing required appointment fields' });
  }

  // Read credentials securely from Vercel Environment Variables
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables');
    return res.status(500).json({ error: 'Server configuration error: Telegram credentials not set' });
  }

  // Construct formatted Telegram Markdown message
  let text = `🏥 *NEW CLINIC APPOINTMENT REQUEST*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `👤 *Patient:* ${name}\n`;
  text += `📞 *Phone:* ${phone}\n`;
  text += `🦷 *Treatment:* ${treatment}\n`;
  text += `⏰ *Preferred Time:* ${time}\n`;
  if (note && note.trim()) {
    text += `📝 *Notes:* ${note.trim()}\n`;
  }
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🌐 *Source:* Smile Dental Web App`;

  try {
    const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });

    const data = await telegramRes.json();

    if (!data.ok) {
      console.error('Telegram API error response:', data);
      return res.status(502).json({ error: data.description || 'Failed to deliver to Telegram' });
    }

    return res.status(200).json({ ok: true, message: 'Appointment sent successfully' });
  } catch (err) {
    console.error('Error contacting Telegram API:', err);
    return res.status(500).json({ error: 'Internal server error contacting Telegram' });
  }
}
