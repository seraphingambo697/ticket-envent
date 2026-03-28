import logging, time, requests
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger('eventapp')


class RemoteUser:
    def __init__(self, data):
        self.id             = data.get('id')
        self.email          = data.get('email')
        self.role           = data.get('role', 'user')
        self.is_authenticated = True
        self.is_active      = data.get('is_active', True)


class RemoteJWTAuth(BaseAuthentication):
    """
    Appel inter-service : event-service → auth-service /api/auth/verify/
    Loggé à chaque requête authentifiée.
    """
    def authenticate(self, request):
        header = request.headers.get('Authorization', '')
        if not header.startswith('Bearer '):
            return None
        token = header.split(' ', 1)[1]
        url   = f"{settings.AUTH_SERVICE_URL}/api/auth/verify/"

        logger.info(f"[COMM → auth-service] POST {url} (vérif token {token[:20]}...)")
        t0 = time.monotonic()
        try:
            resp = requests.post(url, json={'token': token}, timeout=3)
            ms   = round((time.monotonic() - t0) * 1000, 1)
        except requests.RequestException as e:
            ms = round((time.monotonic() - t0) * 1000, 1)
            logger.error(f"[COMM ✗ auth-service] {e} ({ms}ms)")
            raise AuthenticationFailed('Auth service indisponible')

        data  = resp.json()
        valid = resp.status_code == 200 and data.get('valid')
        logger.info(f"[COMM ← auth-service] valid={valid} user={data.get('user',{}).get('email','?')} ({ms}ms)")

        if not valid:
            raise AuthenticationFailed('Token invalide ou expiré')
        return (RemoteUser(data['user']), token)
