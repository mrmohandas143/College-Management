import uuid
from django.db import models
from students.models import Student


class FeeStructure(models.Model):
    FEE_TYPE_CHOICES = [
        ('tuition', 'Tuition Fee'), ('exam', 'Exam Fee'), ('library', 'Library Fee'),
        ('lab', 'Lab Fee'), ('hostel', 'Hostel Fee'), ('transport', 'Transport Fee'),
        ('sports', 'Sports Fee'), ('other', 'Other'),
    ]
    SEMESTER_CHOICES = [(i, f'Semester {i}') for i in range(1, 9)]

    name = models.CharField(max_length=200)
    fee_type = models.CharField(max_length=20, choices=FEE_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    course = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=100, blank=True)
    semester = models.PositiveIntegerField(choices=SEMESTER_CHOICES, null=True, blank=True)
    academic_year = models.CharField(max_length=20, default='2024-25')
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.course} - ₹{self.amount}"


class Fee(models.Model):
    STATUS_CHOICES = [('paid', 'Paid'), ('pending', 'Pending'), ('overdue', 'Overdue')]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='fees')
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fee_type = models.CharField(max_length=100)
    semester = models.PositiveIntegerField(null=True, blank=True)
    academic_year = models.CharField(max_length=20, default='2024-25')
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    payment_mode = models.CharField(max_length=50, blank=True)
    transaction_id = models.CharField(max_length=100, blank=True)
    receipt_number = models.CharField(max_length=50, blank=True, unique=True, null=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.net_amount = self.amount
        if not self.receipt_number and self.status == 'paid':
            self.receipt_number = f"RCP{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student} - {self.fee_type} - {self.status}"
