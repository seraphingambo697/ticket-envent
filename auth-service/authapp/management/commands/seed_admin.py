from django.core.management.base import BaseCommand
from authapp.models import User

class Command(BaseCommand):
    help = 'Crée le compte admin par défaut'

    def handle(self, *args, **kwargs):
        if not User.objects.filter(email='admin@ticketapp.com').exists():
            User.objects.create_superuser(
                email='admin@ticketapp.com',
                password='Admin1234!',
                first_name='Admin',
                last_name='TicketApp',
            )
            self.stdout.write(self.style.SUCCESS('Admin créé : admin@ticketapp.com / Admin1234!'))
        else:
            self.stdout.write('Admin déjà existant.')
