const token = process.env.TELEGRAM_BOT_TOKEN;
const baseUrl = process.env.PUBLIC_BASE_URL;
const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN;

if (!token || !baseUrl || !secretToken) {
  throw new Error('Missing TELEGRAM_BOT_TOKEN, PUBLIC_BASE_URL, or TELEGRAM_WEBHOOK_SECRET_TOKEN.');
}

const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/telegram/webhook`;
const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    url: webhookUrl,
    secret_token: secretToken,
  }),
});

const payload = await response.json();
if (!response.ok || !payload.ok) {
  throw new Error(`setWebhook failed: ${payload.description || response.status}`);
}

console.log(`Webhook set for ${webhookUrl}`);
