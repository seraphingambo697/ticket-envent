import uuid
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name='Ticket',
            fields=[
                ('id',           models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('ticket_number',models.CharField(blank=True, max_length=20, unique=True)),
                ('event_id',     models.UUIDField()),
                ('user_id',      models.UUIDField()),
                ('user_email',   models.EmailField()),
                ('status',       models.CharField(
                                    choices=[('pending','En attente'),('confirmed','Confirmé'),
                                             ('cancelled','Annulé'),('refunded','Remboursé')],
                                    default='pending', max_length=20)),
                ('amount_paid',  models.DecimalField(decimal_places=2, max_digits=10)),
                ('payment_id',   models.CharField(blank=True, max_length=100)),
                ('purchased_at', models.DateTimeField(blank=True, null=True)),
                ('created_at',   models.DateTimeField(auto_now_add=True)),
                ('updated_at',   models.DateTimeField(auto_now=True)),
            ],
            options={'db_table': 'tickets', 'ordering': ['-created_at']},
        ),
    ]
