import uuid, random, string
from django.db import models


class Ticket(models.Model):
    STATUS = [('pending','En attente'),('confirmed','Confirmé'),
              ('cancelled','Annulé'),('refunded','Remboursé')]

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(max_length=20, unique=True, blank=True)
    event_id      = models.UUIDField()
    user_id       = models.UUIDField()
    user_email    = models.EmailField()
    status        = models.CharField(max_length=20, choices=STATUS, default='pending')
    amount_paid   = models.DecimalField(max_digits=10, decimal_places=2)
    payment_id    = models.CharField(max_length=100, blank=True)
    purchased_at  = models.DateTimeField(null=True, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tickets'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            self.ticket_number = 'TKT-' + ''.join(
                random.choices(string.ascii_uppercase + string.digits, k=10)
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Ticket {self.ticket_number} ({self.status})"
