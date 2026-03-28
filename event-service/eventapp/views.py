import logging
from django.db import transaction
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .models import Event
from .serializers import EventSerializer
from .permissions import IsOperatorOrAdminOrReadOnly

logger = logging.getLogger('eventapp')


class EventListCreate(generics.ListCreateAPIView):
    serializer_class   = EventSerializer
    permission_classes = [IsOperatorOrAdminOrReadOnly]

    @extend_schema(summary='Lister les événements')
    def get_queryset(self):
        qs = Event.objects.all()
        if s := self.request.query_params.get('status'):
            qs = qs.filter(status=s)
        return qs

    @extend_schema(summary='Créer un événement')
    def perform_create(self, serializer):
        event = serializer.save(creator_id=self.request.user.id)
        logger.info(f"[EVENT CRÉÉ] id={event.id} titre={event.title} par={self.request.user.email}")


class EventDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = EventSerializer
    permission_classes = [IsOperatorOrAdminOrReadOnly]
    queryset           = Event.objects.all()

    @extend_schema(summary='Détail événement')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(summary='Modifier événement')
    def patch(self, request, *args, **kwargs):
        resp = super().partial_update(request, *args, **kwargs)
        if resp.status_code == 200:
            logger.info(f"[EVENT MAJ] id={kwargs.get('pk')} par={request.user.email} champs={list(request.data.keys())}")
        return resp

    @extend_schema(summary='Supprimer événement')
    def delete(self, request, *args, **kwargs):
        ev = self.get_object()
        logger.warning(f"[EVENT SUPPRIMÉ] id={ev.id} titre={ev.title} par={request.user.email}")
        return super().destroy(request, *args, **kwargs)


class EventSeatsUpdate(generics.UpdateAPIView):
    """
    Endpoint interne appelé par ticket-service pour ajuster les places.
    Utilise SELECT FOR UPDATE pour éviter la survente.
    """
    serializer_class   = EventSerializer
    permission_classes = [permissions.AllowAny]
    queryset           = Event.objects.all()

    @extend_schema(summary='[Interne] Ajuster places disponibles')
    def patch(self, request, pk):
        delta     = request.data.get('delta')
        caller_ip = request.META.get('REMOTE_ADDR', '?')
        logger.info(f"[COMM ENTRANT ← ticket-service {caller_ip}] ajustement places event={pk} delta={delta}")

        if delta is None:
            return Response({'error': 'delta requis'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            event    = Event.objects.select_for_update().get(pk=pk)
            before   = event.available_seats
            new_val  = event.available_seats + int(delta)

            if new_val < 0:
                logger.warning(f"[SURVENTE BLOQUÉE] event={pk} dispo={before} delta={delta}")
                return Response({'error': 'Plus assez de places'}, status=status.HTTP_409_CONFLICT)
            if new_val > event.total_seats:
                return Response({'error': 'Dépasse la capacité totale'}, status=status.HTTP_400_BAD_REQUEST)

            event.available_seats = new_val
            event.save(update_fields=['available_seats'])

        logger.info(f"[PLACES MAJ] event={pk} avant={before} après={new_val} delta={delta}")
        return Response({'available_seats': event.available_seats})
