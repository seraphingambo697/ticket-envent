import logging, time, requests
from django.conf import settings

logger = logging.getLogger('ticketapp')


def get_event(event_id: str):
    """Appel inter-service : ticket-service → event-service"""
    url = f"{settings.EVENT_SERVICE_URL}/api/events/{event_id}/"
    logger.info(f"[COMM → event-service] GET {url}")
    t0 = time.monotonic()
    try:
        resp = requests.get(url, timeout=5)
        ms   = round((time.monotonic() - t0) * 1000, 1)
        if resp.status_code == 200:
            data = resp.json()
            logger.info(f"[COMM ← event-service] OK titre={data.get('title')} places={data.get('available_seats')} ({ms}ms)")
            return data
        logger.warning(f"[COMM ← event-service] HTTP {resp.status_code} ({ms}ms)")
    except requests.RequestException as e:
        ms = round((time.monotonic() - t0) * 1000, 1)
        logger.error(f"[COMM ✗ event-service] {e} ({ms}ms)")
    return None


def reserve_seats(event_id: str, qty: int):
    """Décrémente les places (atomique côté event-service via SELECT FOR UPDATE)."""
    url = f"{settings.EVENT_SERVICE_URL}/api/events/{event_id}/seats/"
    logger.info(f"[COMM → event-service] PATCH {url} delta=-{qty} (réservation)")
    t0 = time.monotonic()
    try:
        resp = requests.patch(url, json={'delta': -qty}, timeout=5)
        ms   = round((time.monotonic() - t0) * 1000, 1)
        data = resp.json()
        ok   = resp.status_code == 200
        logger.info(f"[COMM ← event-service] ok={ok} places_restantes={data.get('available_seats','?')} ({ms}ms)")
        return ok, data
    except requests.RequestException as e:
        ms = round((time.monotonic() - t0) * 1000, 1)
        logger.error(f"[COMM ✗ event-service] {e} ({ms}ms)")
        return False, {'error': str(e)}


def release_seats(event_id: str, qty: int):
    """Restaure les places en cas d'échec (rollback)."""
    url = f"{settings.EVENT_SERVICE_URL}/api/events/{event_id}/seats/"
    logger.info(f"[COMM → event-service] PATCH {url} delta=+{qty} (ROLLBACK places)")
    try:
        requests.patch(url, json={'delta': qty}, timeout=5)
    except Exception as e:
        logger.error(f"[COMM ✗ event-service ROLLBACK] {e} — intervention manuelle requise")


def charge_card(amount, card_data: dict, reference: str):
    """
    Mock paiement CB.
    4111111111111111 → succès
    4000xxxxxxxxxxxx → refus
    """
    card_num    = card_data['card_number']
    card_masked = card_num[:4] + '****' + card_num[-4:]

    logger.info(f"[PAIEMENT] débit {amount}€ carte={card_masked} ref={reference}")

    if not card_num.isdigit() or len(card_num) != 16:
        return False, None, 'Numéro de carte invalide'
    if card_num.startswith('4000'):
        logger.warning(f"[PAIEMENT ✗] carte refusée {card_masked}")
        return False, None, 'Carte refusée par la banque'
    if card_num.startswith('5100'):
        return False, None, 'Provision insuffisante'

    import random, string, time as _time
    pay_id = 'pay_' + ''.join(random.choices(string.ascii_lowercase + string.digits, k=12))
    logger.info(f"[PAIEMENT ✓] montant={amount}€ payment_id={pay_id} ref={reference}")
    return True, pay_id, None
