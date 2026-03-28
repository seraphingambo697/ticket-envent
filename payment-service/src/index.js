const express = require('express');
const amqp = require('amqplib');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) =>
      `[${timestamp}] [${level.toUpperCase()}] [payment-service] ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

const QUEUE = 'ticket_purchased';
const RABB_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672/';

// ── Consommateur RabbitMQ ─────────────────────────────────────────────────
async function startConsumer() {
  // Retry jusqu'à ce que RabbitMQ soit prêt
  for (let i = 0; i < 10; i++) {
    try {
      logger.info(`[RABBIT] connexion tentative ${i + 1} → ${RABB_URL}`);
      const conn = await amqp.connect(RABB_URL);
      const channel = await conn.createChannel();
      await channel.assertQueue(QUEUE, { durable: true });
      channel.prefetch(1);

      logger.info(`[RABBIT ✓] connecté — en écoute sur queue="${QUEUE}"`);

      channel.consume(QUEUE, async (msg) => {
        if (!msg) return;
        try {
          const data = JSON.parse(msg.content.toString());
          logger.info(`[RABBIT ←] message reçu depuis ticket-service`);
          logger.info(`[PAYMENT]  ticket=${data.ticket_number} email=${data.user_email} montant=${data.amount_paid}€ payment_id=${data.payment_id}`);

          // Simulation traitement paiement (enregistrement, réconciliation, etc.)
          await simulatePaymentProcessing(data);

          channel.ack(msg);
          logger.info(`[RABBIT ACK] ticket=${data.ticket_number} traitement OK`);
        } catch (e) {
          logger.error(`[RABBIT NACK] erreur traitement: ${e.message}`);
          channel.nack(msg, false, false); // dead-letter
        }
      });

      conn.on('error', (e) => logger.error(`[RABBIT CONN ERROR] ${e.message}`));
      return;
    } catch (e) {
      logger.warn(`[RABBIT] tentative ${i + 1} échouée: ${e.message} — retry dans 5s`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  logger.error('[RABBIT] impossible de connecter après 10 tentatives');
}

async function simulatePaymentProcessing(data) {
  // En production : appel Stripe, enregistrement en BDD, etc.
  logger.info(`[PAYMENT PROCESSING] enregistrement paiement payment_id=${data.payment_id} montant=${data.amount_paid}€`);
  await new Promise(r => setTimeout(r, 50)); // simule I/O
  logger.info(`[PAYMENT PROCESSED ✓] payment_id=${data.payment_id}`);
}

// ── API HTTP (health + webhook simulation) ───────────────────────────────
const app = express();
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`[REQ] ${req.method} ${req.url}`);
  next();
});

app.post('/api/payments/charge', (req, res) => {
  const { amount, card_number, card_expiry, card_cvc, reference } = req.body;
  const masked = card_number ? card_number.slice(0, 4) + '****' + card_number.slice(-4) : '????';

  logger.info(`[CHARGE] montant=${amount}€ carte=${masked} ref=${reference}`);

  if (!amount || !card_number || !card_expiry || !card_cvc)
    return res.status(400).json({ success: false, error: 'Champs manquants' });
  if (!/^\d{16}$/.test(card_number))
    return res.status(400).json({ success: false, error: 'Numéro de carte invalide' });
  if (card_number.startsWith('4000')) {
    logger.warn(`[CHARGE ✗] carte refusée ${masked}`);
    return res.json({ success: false, error: 'Carte refusée par la banque' });
  }
  if (card_number.startsWith('5100'))
    return res.json({ success: false, error: 'Provision insuffisante' });

  const payId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  logger.info(`[CHARGE ✓] payment_id=${payId} montant=${amount}€`);
  res.json({ success: true, payment_id: payId, amount, currency: 'EUR', reference });
});

app.post('/api/payments/refund', (req, res) => {
  const { payment_id, amount } = req.body;
  if (!payment_id) return res.status(400).json({ success: false, error: 'payment_id requis' });
  const refundId = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  logger.info(`[REFUND ✓] refund_id=${refundId} payment_id=${payment_id} montant=${amount}€`);
  res.json({ success: true, refund_id: refundId, payment_id, amount });
});

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'payment-service' }));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => logger.info(`Payment service HTTP démarré sur :${PORT}`));
startConsumer();
