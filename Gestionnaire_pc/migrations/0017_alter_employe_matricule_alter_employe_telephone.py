# Generated by Django 5.1.4 on 2025-07-22 11:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Gestionnaire_pc', '0016_alter_employe_date_embauche'),
    ]

    operations = [
        migrations.AlterField(
            model_name='employe',
            name='matricule',
            field=models.CharField(default='Matricule inconnu', max_length=50),
        ),
        migrations.AlterField(
            model_name='employe',
            name='telephone',
            field=models.CharField(default='0123456789', max_length=20),
        ),
    ]
