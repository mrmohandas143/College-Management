from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('students', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='student',
            name='cgpa',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=4, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='attendance_percentage',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
    ]
