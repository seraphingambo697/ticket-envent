const express = require('express');
const amqp = require('amqplib');
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

const QUEUE = 'ticket_purchased';
const RABB_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672/';

function sendEmail(to, subject, body) {
  logger.info('[EMAIL SIMULE] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('[EMAIL] A       : ' + to);
  logger.info('[EMAIL] Sujet   : ' + subject);
  logger.info('[EMAIL] Message :\n' + body);
  logger.info('[EMAIL] Envoye (simulation — brancher SendGrid/Mailgun en prod)');
}

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
          logger.info('[RABBIT <-] message recu depuis ticket-service');
          logger.info('[NOTIF] ticket=' + data.ticket_number + ' email=' + data.user_email);

          const subject = 'Confirmation de votre billet : ' + data.ticket_number;
          const body = [
            'Bonjour,',
            '',
            'Votre achat est confirme !',
            '',
            '  Billet n    : ' + data.ticket_number,
            '  Evenement   : ' + (data.event_title || data.event_id),
            '  Montant paye: ' + data.amount_paid + ' EUR',
            '  Reference   : ' + data.payment_id,
            '',
            'Presentez ce numero a l\'entree de la salle.',
            '',
            'A bientot !',
            'L\'equipe TicketApp',
          ].join('\n');

          sendEmail(data.user_email, subject, body);
          channel.ack(msg);
          logger.info('[RABBIT ACK] notification envoyee pour ticket=' + data.ticket_number);
        } catch (e) {
          logger.error('[NOTIF ERREUR] ' + e.message);
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


// ── CORS 
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});


app.use((req, res, next) => {
  logger.info('[REQ] ' + req.method + ' ' + req.url);
  next();
});

app.post('/api/notifications/send', (req, res) => {
  const { to, subject, body } = req.body;
  if (!to || !subject) return res.status(400).json({ error: 'to et subject requis' });
  sendEmail(to, subject, body || '');
  res.json({ success: true, message: 'Notification envoyee' });
});

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'notif-service' }));

app.use((err, req, res, next) => {
  logger.error('[ERREUR] ' + err.message);
  res.status(500).json({ error: 'Erreur interne' });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => logger.info('Notif service demarre sur :' + PORT));
startConsumer();
