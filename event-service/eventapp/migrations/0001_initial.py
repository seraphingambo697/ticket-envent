import uuid
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name='Event',
            fields=[
                ('id',              models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('title',           models.CharField(max_length=255)),
                ('description',     models.TextField(blank=True)),
                ('venue',           models.CharField(max_length=255)),
                ('city',            models.CharField(max_length=100)),
                ('date',            models.DateTimeField()),
                ('total_seats',     models.PositiveIntegerField()),
                ('available_seats', models.PositiveIntegerField()),
                ('price',           models.DecimalField(decimal_places=2, max_digits=10)),
                ('status',          models.CharField(
                                        choices=[('draft','Brouillon'),('published','Publié'),
                                                 ('cancelled','Annulé'),('done','Terminé')],
                                        default='draft', max_length=20)),
                ('creator_id',      models.UUIDField()),
                ('created_at',      models.DateTimeField(auto_now_add=True)),
                ('updated_at',      models.DateTimeField(auto_now=True)),
            ],
            options={'db_table': 'events', 'ordering': ['date']},
        ),
    ]
