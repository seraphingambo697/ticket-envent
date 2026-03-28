import logging
from django.db import transaction
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .models import Ticket
from .serializers import TicketSerializer, PurchaseSerializer
from .services import get_event, reserve_seats, release_seats, charge_card
from .rabbit import publish_ticket_purchased

logger = logging.getLogger('ticketapp')


class TicketList(generics.ListAPIView):
    serializer_class = TicketSerializer

    @extend_schema(summary='Mes billets')
    def get_queryset(self):
        user = self.request.user
        if user.role in ('admin', 'operator'):
            return Ticket.objects.all()
        return Ticket.objects.filter(user_id=user.id)


class TicketDetail(generics.RetrieveAPIView):
    serializer_class = TicketSerializer

    @extend_schema(summary='Détail billet')
    def get_queryset(self):
        user = self.request.user
        if user.role in ('admin', 'operator'):
            return Ticket.objects.all()
        return Ticket.objects.filter(user_id=user.id)


@extend_schema(summary='Acheter des billets', request=PurchaseSerializer)
@api_view(['POST'])
def purchase(request):
    """
    Flux d'achat — 4 étapes inter-services :
    1. GET   event-service   → infos événement
    2. PATCH event-service   → réserver places (SELECT FOR UPDATE)
    3. Mock  paiement CB     → débiter la carte
    4. Pub   RabbitMQ        → notif + payment-service en async
    """
    s = PurchaseSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    data     = s.validated_data
    user     = request.user
    qty      = data['quantity']
    event_id = str(data['event_id'])

    logger.info(f"[ACHAT DÉMARRÉ] user={user.email} event={event_id} qty={qty}")

    # ── Étape 1 : Récupérer l'event ──────────────────────────────────────
    event = get_event(event_id)
    if not event:
        return Response({'error': 'Événement introuvable'}, status=status.HTTP_404_NOT_FOUND)
    if event.get('status') != 'published':
        return Response({'error': 'Événement non disponible'}, status=status.HTTP_409_CONFLICT)
    if event.get('available_seats', 0) < qty:
        return Response({'error': 'Plus assez de places'}, status=status.HTTP_409_CONFLICT)

    total   = float(event['price']) * qty
    logger.info(f"[ACHAT ÉT.1 OK] event={event.get('title')} prix={event['price']}€ total={total}€")

    # ── Étape 2 : Réserver les places ────────────────────────────────────
    ok, result = reserve_seats(event_id, qty)
    if not ok:
        logger.warning(f"[ACHAT ÉT.2 FAIL] {result.get('error')}")
        return Response({'error': result.get('error', 'Réservation impossible')}, status=status.HTTP_409_CONFLICT)
    logger.info(f"[ACHAT ÉT.2 OK] {qty} place(s) réservée(s)")

    # ── Créer billets PENDING ────────────────────────────────────────────
    tickets = []
    try:
        with transaction.atomic():
            for _ in range(qty):
                t = Ticket.objects.create(
                    event_id=event_id, user_id=user.id,
                    user_email=user.email, status='pending',
                    amount_paid=float(event['price']),
                )
                tickets.append(t)
        logger.info(f"[BILLETS PENDING] {[t.ticket_number for t in tickets]}")
    except Exception as e:
        logger.error(f"[CRÉATION BILLET FAIL] {e} — rollback places")
        release_seats(event_id, qty)
        return Response({'error': 'Erreur création billet'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ── Étape 3 : Paiement CB ────────────────────────────────────────────
    card_data = {k: data[k] for k in ('card_number', 'card_expiry', 'card_cvc')}
    ok, pay_id, pay_err = charge_card(total, card_data, tickets[0].ticket_number)

    if not ok:
        logger.warning(f"[ACHAT ÉT.3 FAIL] paiement refusé : {pay_err} — rollback")
        Ticket.objects.filter(id__in=[t.id for t in tickets]).update(status='cancelled')
        release_seats(event_id, qty)
        return Response({'error': pay_err or 'Paiement refusé'}, status=status.HTTP_402_PAYMENT_REQUIRED)

    # ── Confirmer billets ────────────────────────────────────────────────
    now = timezone.now()
    Ticket.objects.filter(id__in=[t.id for t in tickets]).update(
        status='confirmed', payment_id=pay_id, purchased_at=now,
    )
    logger.info(f"[ACHAT ÉT.3 OK] payment_id={pay_id} billets={[t.ticket_number for t in tickets]}")

    # ── Étape 4 : Publier sur RabbitMQ (async) ───────────────────────────
    for t in tickets:
        publish_ticket_purchased({
            'ticket_number': t.ticket_number,
            'user_email':    user.email,
            'event_id':      event_id,
            'event_title':   event.get('title'),
            'amount_paid':   str(event['price']),
            'payment_id':    pay_id,
        })

    logger.info(f"[ACHAT TERMINÉ ✓] user={user.email} billets={[t.ticket_number for t in tickets]} total={total}€")
    refreshed = Ticket.objects.filter(id__in=[t.id for t in tickets])
    return Response(TicketSerializer(refreshed, many=True).data, status=status.HTTP_201_CREATED)
