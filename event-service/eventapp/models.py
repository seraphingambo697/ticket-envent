import uuid
from django.db import models


class Event(models.Model):
    STATUS = [('draft','Brouillon'),('published','Publié'),('cancelled','Annulé'),('done','Terminé')]

    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title            = models.CharField(max_length=255)
    description      = models.TextField(blank=True)
    venue            = models.CharField(max_length=255)
    city             = models.CharField(max_length=100)
    date             = models.DateTimeField()
    total_seats      = models.PositiveIntegerField()
    available_seats  = models.PositiveIntegerField()
    price            = models.DecimalField(max_digits=10, decimal_places=2)
    status           = models.CharField(max_length=20, choices=STATUS, default='draft')
    creator_id       = models.UUIDField()
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'events'
        ordering = ['date']

    def __str__(self):
        return f"{self.title} @ {self.venue}"
