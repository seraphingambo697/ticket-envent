from rest_framework import serializers
from .models import User

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = User
        fields = ['email', 'password', 'first_name', 'last_name', 'role']
        extra_kwargs = {'role': {'default': 'user'}}

    def validate_role(self, value):
        request = self.context.get('request')
        if value in ('admin', 'operator'):
            if not request or not request.user.is_authenticated or request.user.role != 'admin':
                raise serializers.ValidationError('Seul un admin peut créer ce rôle.')
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
