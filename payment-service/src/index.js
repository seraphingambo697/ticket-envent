const express = require('express');
const amqp = require('amqplib');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) =>
      '[' + timestamp + '] [' + level.toUpperCase() + '] [payment-service] ' + message)
  ),
  transports: [new winston.transports.Console()],
});

const QUEUE = 'ticket_purchased';
const RABB_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672/';

async function startConsumer() {
  for (let i = 0; i < 10; i++) {
    try {
      logger.info('[RABBIT] connexion tentative ' + (i + 1) + ' -> ' + RABB_URL);
      const conn = await amqp.connect(RABB_URL);
      const channel = await conn.createChannel();
      await channel.assertQueue(QUEUE, { durable: true });
      channel.prefetch(1);

      logger.info('[RABBIT OK] connecte — en ecoute sur queue="' + QUEUE + '"');

      channel.consume(QUEUE, async (msg) => {
        if (!msg) return;
        try {
          const data = JSON.parse(msg.content.toString());
          logger.info('[RABBIT <-] payment message recu depuis ticket-service');
          logger.info('[PAYMENT] ticket=' + data.ticket_number
            + ' email=' + data.user_email
            + ' montant=' + data.amount_paid + 'EUR'
            + ' payment_id=' + data.payment_id);

          // Simulation traitement (enregistrement BDD, réconciliation, etc.)
          await new Promise(r => setTimeout(r, 50));
          logger.info('[PAYMENT PROCESSED OK] payment_id=' + data.payment_id);

          channel.ack(msg);
          logger.info('[RABBIT ACK] traitement OK pour ticket=' + data.ticket_number);
        } catch (e) {
          logger.error('[RABBIT NACK] erreur: ' + e.message);
          channel.nack(msg, false, false);
        }
      });

      conn.on('error', (e) => logger.error('[RABBIT CONN ERROR] ' + e.message));
      return;
    } catch (e) {
      logger.warn('[RABBIT] tentative ' + (i + 1) + ' echouee: ' + e.message + ' — retry dans 5s');
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  logger.error('[RABBIT] impossible de connecter apres 10 tentatives');
}

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const lvl = res.statusCode >= 400 ? 'warn' : 'info';
    logger[lvl]('[REQ] ' + req.method + ' ' + req.url + ' -> ' + res.statusCode + ' (' + (Date.now() - start) + 'ms)');
  });
  next();
});

app.post('/api/payments/charge', (req, res) => {
  const { amount, card_number, card_expiry, card_cvc, reference } = req.body;
  const masked = card_number ? card_number.slice(0, 4) + '****' + card_number.slice(-4) : '????';

  logger.info('[CHARGE] montant=' + amount + 'EUR carte=' + masked + ' ref=' + reference);

  if (!amount || !card_number || !card_expiry || !card_cvc)
    return res.status(400).json({ success: false, error: 'Champs manquants' });

  if (!/^\d{16}$/.test(card_number))
    return res.status(400).json({ success: false, error: 'Numero de carte invalide' });

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0)
    return res.status(400).json({ success: false, error: 'Montant invalide' });

  if (card_number.startsWith('4000')) {
    logger.warn('[CHARGE REFUSEE] carte=' + masked);
    return res.json({ success: false, error: 'Carte refusee par la banque' });
  }
  if (card_number.startsWith('5100'))
    return res.json({ success: false, error: 'Provision insuffisante' });

  const payId = 'pay_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  logger.info('[CHARGE OK] payment_id=' + payId + ' montant=' + parsedAmount + 'EUR');
  res.json({ success: true, payment_id: payId, amount: parsedAmount, currency: 'EUR', reference });
});

app.post('/api/payments/refund', (req, res) => {
  const { payment_id, amount } = req.body;
  if (!payment_id) return res.status(400).json({ success: false, error: 'payment_id requis' });
  const refundId = 'ref_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  logger.info('[REFUND OK] refund_id=' + refundId + ' payment_id=' + payment_id);
  res.json({ success: true, refund_id: refundId, payment_id, amount });
});

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'payment-service' }));

app.use((err, req, res, next) => {
  logger.error('[ERREUR] ' + err.message);
  res.status(500).json({ error: 'Erreur interne' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => logger.info('Payment service demarre sur :' + PORT));
startConsumer();
