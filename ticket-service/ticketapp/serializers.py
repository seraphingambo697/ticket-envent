from rest_framework import serializers
from .models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Ticket
        fields = '__all__'
        read_only_fields = ['id','ticket_number','user_id','user_email',
                            'status','payment_id','purchased_at','created_at','updated_at']


class PurchaseSerializer(serializers.Serializer):
    event_id    = serializers.UUIDField()
    quantity    = serializers.IntegerField(min_value=1, max_value=10, default=1)
    card_number = serializers.CharField(max_length=16, min_length=16, write_only=True)
    card_expiry = serializers.CharField(max_length=5,  write_only=True)
    card_cvc    = serializers.CharField(max_length=4,  min_length=3, write_only=True)
