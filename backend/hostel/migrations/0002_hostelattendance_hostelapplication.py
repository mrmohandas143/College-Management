import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('hostel', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='HostelApplication',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('student_name', models.CharField(max_length=200)),
                ('student_id', models.CharField(blank=True, max_length=50)),
                ('contact', models.CharField(blank=True, max_length=20)),
                ('gender', models.CharField(choices=[('male', 'Male'), ('female', 'Female')], default='male', max_length=10)),
                ('reason', models.TextField(blank=True)),
                ('applied_on', models.DateTimeField(auto_now_add=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending', max_length=10)),
                ('remarks', models.CharField(blank=True, max_length=300)),
                ('preferred_block', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='hostel.hostelblock')),
            ],
        ),
        migrations.CreateModel(
            name='HostelAttendance',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('check_in', models.TimeField(blank=True, null=True)),
                ('check_out', models.TimeField(blank=True, null=True)),
                ('present', models.BooleanField(default=True)),
                ('remarks', models.CharField(blank=True, max_length=200)),
                ('allotment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attendance', to='hostel.hostelallotment')),
            ],
            options={
                'unique_together': {('allotment', 'date')},
            },
        ),
    ]
