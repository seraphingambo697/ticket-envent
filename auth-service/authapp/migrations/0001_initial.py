import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('password',    models.CharField(max_length=128)),
                ('last_login',  models.DateTimeField(blank=True, null=True)),
                ('is_superuser',models.BooleanField(default=False)),
                ('id',          models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('email',       models.EmailField(unique=True)),
                ('first_name',  models.CharField(blank=True, max_length=100)),
                ('last_name',   models.CharField(blank=True, max_length=100)),
                ('role',        models.CharField(
                                    choices=[('admin','Admin'),('operator','Operator'),('user','User')],
                                    default='user', max_length=20)),
                ('is_active',   models.BooleanField(default=True)),
                ('is_staff',    models.BooleanField(default=False)),
                ('created_at',  models.DateTimeField(auto_now_add=True)),
            ],
            options={'db_table': 'auth_users'},
        ),
    ]
