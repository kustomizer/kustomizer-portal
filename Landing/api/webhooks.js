const crypto = require('node:crypto');

function asSingleHeaderValue(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }

  return null;
}

function normalizeTopic(value) {
  const topic = typeof value === 'string' ? value.trim().toLowerCase() : null;
  return topic && topic.length > 0 ? topic : null;
}

function isPrivacyTopic(topic) {
  return topic === 'customers/data_request' || topic === 'customers/redact' || topic === 'shop/redact';
}

function safeCompare(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') {
    return false;
  }

  const a = Buffer.from(left);
  const b = Buffer.from(right);

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

function getWebhookSecret() {
  const direct = process.env['SHOPIFY_WEBHOOK_SECRET']?.trim();
  if (direct) {
    return direct;
  }

  const clientSecret = process.env['SHOPIFY_APP_CLIENT_SECRET']?.trim();
  if (clientSecret) {
    return clientSecret;
  }

  const legacySecret = process.env['SHOPIFY_API_SECRET']?.trim();
  return legacySecret && legacySecret.length > 0 ? legacySecret : null;
}

function verifyWebhookHmac(rawBody, providedHmac, secret) {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  return safeCompare(expected, providedHmac.trim());
}

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (typeof req.body === 'string') {
    return Buffer.from(req.body);
  }

  if (req.body && typeof req.body === 'object') {
    return Buffer.from(JSON.stringify(req.body));
  }

  return await new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => {
      if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk));
        return;
      }

      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    req.on('error', (error) => {
      reject(error);
    });
  });
}

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    json(res, 405, { message: 'Method not allowed' });
    return;
  }

  const topic = normalizeTopic(asSingleHeaderValue(req.headers['x-shopify-topic']));

  if (!isPrivacyTopic(topic)) {
    json(res, 200, { ok: true });
    return;
  }

  const secret = getWebhookSecret();
  if (!secret) {
    json(res, 500, { message: 'Missing SHOPIFY_WEBHOOK_SECRET' });
    return;
  }

  const providedHmac = asSingleHeaderValue(req.headers['x-shopify-hmac-sha256']);
  if (!providedHmac) {
    json(res, 401, { message: 'Missing Shopify webhook HMAC' });
    return;
  }

  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch {
    json(res, 400, { message: 'Invalid webhook body' });
    return;
  }

  if (!verifyWebhookHmac(rawBody, providedHmac, secret)) {
    json(res, 401, { message: 'Invalid Shopify webhook HMAC' });
    return;
  }

  let payload = null;
  try {
    payload = rawBody.length > 0 ? JSON.parse(rawBody.toString('utf-8')) : null;
  } catch {
    payload = null;
  }

  const payloadShopDomain = payload && typeof payload === 'object' ? payload['shop_domain'] : null;
  const shopDomain =
    (typeof payloadShopDomain === 'string' && payloadShopDomain) ||
    asSingleHeaderValue(req.headers['x-shopify-shop-domain']) ||
    null;

  console.info('shopify-privacy-webhook', {
    topic,
    shop_domain: shopDomain,
    webhook_id: asSingleHeaderValue(req.headers['x-shopify-webhook-id']) || null,
  });

  json(res, 200, { ok: true });
}

module.exports = handler;
module.exports.config = {
  runtime: 'nodejs',
  api: {
    bodyParser: false,
  },
};
