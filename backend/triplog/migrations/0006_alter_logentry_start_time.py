# Generated by Django 5.1.7 on 2025-04-04 23:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('triplog', '0005_triplog_remarks'),
    ]

    operations = [
        migrations.AlterField(
            model_name='logentry',
            name='start_time',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
