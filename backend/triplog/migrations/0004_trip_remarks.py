# Generated by Django 5.1.7 on 2025-04-02 12:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('triplog', '0003_logentry_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='trip',
            name='remarks',
            field=models.TextField(blank=True, null=True),
        ),
    ]
