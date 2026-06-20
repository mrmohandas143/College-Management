from django.db import models


class Faculty(models.Model):
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=100)
    course = models.CharField(max_length=100, blank=True)
    designation = models.CharField(max_length=100)
    qualification = models.CharField(max_length=100, blank=True)
    experience = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
