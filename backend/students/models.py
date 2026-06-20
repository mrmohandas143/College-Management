from django.db import models


class Student(models.Model):
    GENDER_CHOICES = [('male', 'Male'), ('female', 'Female'), ('other', 'Other')]
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    course = models.CharField(max_length=100)
    department = models.CharField(max_length=100, blank=True)
    year = models.PositiveIntegerField(default=1)
    roll_number = models.CharField(max_length=50, unique=True, default='')
    register_number = models.CharField(max_length=50, blank=True, default='')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    cgpa = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    photo = models.ImageField(upload_to='students/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Keep register_number in sync with roll_number if not set
        if not self.register_number:
            self.register_number = self.roll_number
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
