import logging
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.authentication import JWTAuthentication
from drf_spectacular.utils import extend_schema
from .models import User
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer

logger = logging.getLogger('authapp')


class RegisterView(generics.CreateAPIView):
    serializer_class   = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    @extend_schema(summary='Créer un compte')
    def create(self, request, *args, **kwargs):
        logger.info(f"[REGISTER] tentative email={request.data.get('email')} role={request.data.get('role','user')}")
        s = self.get_serializer(data=request.data, context={'request': request})
        s.is_valid(raise_exception=True)
        user    = s.save()
        refresh = RefreshToken.for_user(user)
        refresh['role']  = user.role
        refresh['email'] = user.email
        logger.info(f"[REGISTER OK] user_id={user.id} email={user.email} role={user.role}")
        return Response({
            'user':    UserSerializer(user).data,
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


@extend_schema(summary='Login')
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    s = LoginSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    email = s.validated_data['email']
    logger.info(f"[LOGIN] tentative email={email}")
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        logger.warning(f"[LOGIN FAIL] email={email} raison=inconnu")
        return Response({'error': 'Identifiants invalides'}, status=status.HTTP_401_UNAUTHORIZED)
    if not user.check_password(s.validated_data['password']):
        logger.warning(f"[LOGIN FAIL] email={email} raison=mauvais_mdp")
        return Response({'error': 'Identifiants invalides'}, status=status.HTTP_401_UNAUTHORIZED)
    if not user.is_active:
        return Response({'error': 'Compte désactivé'}, status=status.HTTP_403_FORBIDDEN)
    refresh = RefreshToken.for_user(user)
    refresh['role']  = user.role
    refresh['email'] = user.email
    logger.info(f"[LOGIN OK] user_id={user.id} email={user.email} role={user.role}")
    return Response({
        'user':    UserSerializer(user).data,
        'access':  str(refresh.access_token),
        'refresh': str(refresh),
    })


@extend_schema(summary='Logout')
@api_view(['POST'])
def logout_view(request):
    try:
        token = RefreshToken(request.data.get('refresh'))
        token.blacklist()
        logger.info(f"[LOGOUT] user={request.user.email}")
        return Response({'message': 'Déconnecté avec succès'})
    except TokenError as e:
        return Response({'error': 'Token invalide'}, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(summary='Vérifier token (interne — appelé par les autres services)')
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_token_view(request):
    token_str = request.data.get('token', '')
    caller_ip = request.META.get('REMOTE_ADDR', '?')
    logger.info(f"[VERIFY TOKEN] demande de {caller_ip} token={token_str[:20]}...")
    if not token_str:
        return Response({'error': 'Token requis'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        auth      = JWTAuthentication()
        validated = auth.get_validated_token(token_str)
        user      = auth.get_user(validated)
        logger.info(f"[VERIFY TOKEN OK] email={user.email} role={user.role} → réponse à {caller_ip}")
        return Response({'valid': True, 'user': UserSerializer(user).data})
    except Exception as e:
        logger.warning(f"[VERIFY TOKEN FAIL] depuis {caller_ip} raison={e}")
        return Response({'valid': False, 'error': 'Token invalide ou expiré'}, status=status.HTTP_401_UNAUTHORIZED)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    @extend_schema(summary='Mon profil')
    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer

    @extend_schema(summary='Liste utilisateurs (admin)')
    def get_queryset(self):
        if self.request.user.role != 'admin':
            return User.objects.filter(id=self.request.user.id)
        return User.objects.all()
