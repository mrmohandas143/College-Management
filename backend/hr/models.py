from django.db import models
from departments.models import Department
from faculty.models import Faculty


class Employee(models.Model):
    EMPLOYMENT_TYPE = [('full_time', 'Full Time'), ('part_time', 'Part Time'), ('contract', 'Contract')]
    STATUS = [('active', 'Active'), ('inactive', 'Inactive'), ('terminated', 'Terminated')]
    GENDER = [('male', 'Male'), ('female', 'Female'), ('other', 'Other')]

    employee_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='employees')
    designation = models.CharField(max_length=100)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE, default='full_time')
    date_of_joining = models.DateField()
    basic_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS, default='active')
    faculty = models.OneToOneField(
        Faculty, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='hr_employee',
        help_text='Linked faculty record (auto-populated on sync)',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_id})"


class Attendance(models.Model):
    STATUS = [('present', 'Present'), ('absent', 'Absent'), ('half_day', 'Half Day'), ('holiday', 'Holiday')]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS, default='present')
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    note = models.CharField(max_length=200, blank=True)

    class Meta:
        unique_together = ('employee', 'date')

    def __str__(self):
        return f"{self.employee} - {self.date} ({self.status})"


class LeaveRequest(models.Model):
    LEAVE_TYPE = [('sick', 'Sick'), ('casual', 'Casual'), ('earned', 'Earned'), ('unpaid', 'Unpaid')]
    STATUS = [('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leaves')
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPE)
    from_date = models.DateField()
    to_date = models.DateField()
    days = models.PositiveIntegerField(default=1)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    applied_on = models.DateTimeField(auto_now_add=True)
    remarks = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        delta = (self.to_date - self.from_date).days + 1
        self.days = delta
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee} - {self.leave_type} ({self.from_date} to {self.to_date})"


class PayrollConfig(models.Model):
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='payroll_config')
    hra_percent = models.DecimalField(max_digits=5, decimal_places=2, default=20)       # % of basic
    ta_percent = models.DecimalField(max_digits=5, decimal_places=2, default=10)        # % of basic
    pf_percent = models.DecimalField(max_digits=5, decimal_places=2, default=12)        # % of basic
    tax_percent = models.DecimalField(max_digits=5, decimal_places=2, default=10)       # % of gross
    other_allowances = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    other_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"Config: {self.employee}"


class Payroll(models.Model):
    STATUS = [('draft', 'Draft'), ('processed', 'Processed'), ('paid', 'Paid')]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='payrolls')
    month = models.PositiveIntegerField()   # 1-12
    year = models.PositiveIntegerField()
    working_days = models.PositiveIntegerField(default=26)
    present_days = models.PositiveIntegerField(default=0)
    half_day     = models.PositiveIntegerField(default=0)
    leave_days = models.PositiveIntegerField(default=0)
    absent_days = models.PositiveIntegerField(default=0)

    basic_salary = models.DecimalField(max_digits=10, decimal_places=2)
    hra = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    ta = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    other_allowances = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gross_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    pf_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    absent_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    other_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    net_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # rates snapshot — stored so payslip always shows the exact % used
    hra_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    ta_pct  = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    pf_pct  = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    status = models.CharField(max_length=20, choices=STATUS, default='draft')
    paid_on = models.DateField(null=True, blank=True)
    processed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('employee', 'month', 'year')

    def __str__(self):
        return f"{self.employee} - {self.month}/{self.year}"
