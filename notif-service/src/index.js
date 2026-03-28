\
const express = require('express');
const amqp    = require('amqplib');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) =>
      `[${timestamp}] [${level.toUpperCase()}] [notif-service] ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

const QUEUE    = 'ticket_purchased';
const RABB_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672/';

// ── Simulateur d'envoi email/SMS ──────────────────────────────────────────
function sendEmail(to, subject, body) {
  logger.info(`[EMAIL SIMULÉ] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  logger.info(`[EMAIL] À       : ${to}`);
  logger.info(`[EMAIL] Sujet   : ${subject}`);
  logger.info(`[EMAIL] Message :\n${body}`);
  logger.info(`[EMAIL] ✓ Envoyé (simulation — brancher SendGrid/Mailgun en prod)`);
}

// ── Consommateur RabbitMQ ─────────────────────────────────────────────────
async function startConsumer() {
  for (let i = 0; i < 10; i++) {
    try {
      logger.info(`[RABBIT] connexion tentative ${i + 1} → ${RABB_URL}`);
      const conn    = await amqp.connect(RABB_URL);
      const channel = await conn.createChannel();
      await channel.assertQueue(QUEUE, { durable: true });
      channel.prefetch(1);

      logger.info(`[RABBIT ✓] connecté — en écoute sur queue="${QUEUE}"`);

      channel.consume(QUEUE, async (msg) => {
        if (!msg) return;
        try {
          const data = JSON.parse(msg.content.toString());
          logger.info(`[RABBIT ←] message reçu depuis ticket-service`);
          logger.info(`[NOTIF] Préparation confirmation pour ticket=${data.ticket_number} email=${data.user_email}`);

          const subject = `Confirmation de votre billet : ${data.ticket_number}`;
          const body = [
            `Bonjour,`,
            ``,
            `Votre achat est confirmé !`,
            ``,
            `  Billet n°   : ${data.ticket_number}`,
            `  Événement   : ${data.event_title || data.event_id}`,
            `  Montant payé: ${data.amount_paid} €`,
            `  Référence   : ${data.payment_id}`,
            ``,
            `Présentez ce numéro à l'entrée de la salle.`,
            `Votre billet est lié à votre compte et vérifiable à tout moment.`,
            ``,
            `À bientôt !`,
            `L'équipe TicketApp`,
          ].join('\n');

          sendEmail(data.user_email, subject, body);

          channel.ack(msg);
          logger.info(`[RABBIT ACK] notification envoyée pour ticket=${data.ticket_number}`);
        } catch (e) {
          logger.error(`[NOTIF ERREUR] ${e.message}`);
          channel.nack(msg, false, false);
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

// ── API HTTP ───────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`[REQ] ${req.method} ${req.url}`);
  next();
});

// Endpoint HTTP direct (optionnel — pour appels synchrones)
app.post('/api/notifications/send', (req, res) => {
  const { to, subject, body } = req.body;
  if (!to || !subject) return res.status(400).json({ error: 'to et subject requis' });
  sendEmail(to, subject, body || '');
  res.json({ success: true, message: 'Notification envoyée' });
});

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'notif-service' }));

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => logger.info(`Notif service HTTP démarré sur :${PORT}`));
startConsumer();
