from rest_framework import serializers
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    creator_id = serializers.UUIDField(read_only=True)

    class Meta:
        model  = Event
        fields = '__all__'
        read_only_fields = ['id', 'available_seats', 'creator_id', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Initialiser les places disponibles = places totales
        validated_data['available_seats'] = validated_data['total_seats']
        return super().create(validated_data)
