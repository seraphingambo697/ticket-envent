import json, logging, pika
from django.conf import settings

logger = logging.getLogger('ticketapp')

QUEUE_TICKET_PURCHASED = 'ticket_purchased'


def publish_ticket_purchased(ticket_data: dict):
    """
    Publie un message sur RabbitMQ après un achat confirmé.
    Payment-service et notif-service consomment ce message.
    Non-bloquant : si RabbitMQ est indisponible, on log et on continue.
    """
    try:
        logger.info(f"[RABBIT →] publish queue={QUEUE_TICKET_PURCHASED} ticket={ticket_data.get('ticket_number')}")
        conn    = pika.BlockingConnection(pika.URLParameters(settings.RABBITMQ_URL))
        channel = conn.channel()
        channel.queue_declare(queue=QUEUE_TICKET_PURCHASED, durable=True)
        channel.basic_publish(
            exchange='',
            routing_key=QUEUE_TICKET_PURCHASED,
            body=json.dumps(ticket_data),
            properties=pika.BasicProperties(delivery_mode=2),  # persistant
        )
        conn.close()
        logger.info(f"[RABBIT ✓] message publié pour ticket={ticket_data.get('ticket_number')}")
    except Exception as e:
        logger.error(f"[RABBIT ✗] impossible de publier : {e} — achat déjà confirmé, on continue")
