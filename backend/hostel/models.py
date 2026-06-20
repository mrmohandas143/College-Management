from django.db import models


class HostelBlock(models.Model):
    name     = models.CharField(max_length=100, unique=True)
    gender   = models.CharField(max_length=10, choices=[('male','Male'),('female','Female'),('mixed','Mixed')], default='mixed')
    warden   = models.CharField(max_length=100, blank=True)
    capacity = models.PositiveIntegerField(default=0)
    def __str__(self): return self.name


class Room(models.Model):
    STATUS = [('available','Available'),('occupied','Occupied'),('maintenance','Maintenance')]
    TYPE   = [('single','Single'),('double','Double'),('triple','Triple')]
    block       = models.ForeignKey(HostelBlock, on_delete=models.CASCADE, related_name='rooms')
    room_number = models.CharField(max_length=20)
    room_type   = models.CharField(max_length=10, choices=TYPE, default='double')
    capacity    = models.PositiveIntegerField(default=2)
    occupied    = models.PositiveIntegerField(default=0)
    status      = models.CharField(max_length=20, choices=STATUS, default='available')
    floor       = models.PositiveIntegerField(default=1)

    class Meta: unique_together = ('block', 'room_number')
    def __str__(self): return f"{self.block.name} — Room {self.room_number}"


class HostelAllotment(models.Model):
    STATUS = [('active','Active'),('vacated','Vacated')]
    room           = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='allotments')
    student_name   = models.CharField(max_length=200)
    student_id     = models.CharField(max_length=50, blank=True)
    contact        = models.CharField(max_length=20, blank=True)
    allotment_date = models.DateField()
    vacating_date  = models.DateField(null=True, blank=True)
    status         = models.CharField(max_length=20, choices=STATUS, default='active')

    def __str__(self): return f"{self.student_name} → {self.room}"


class HostelFee(models.Model):
    STATUS = [('paid','Paid'),('pending','Pending'),('overdue','Overdue')]
    allotment   = models.ForeignKey(HostelAllotment, on_delete=models.CASCADE, related_name='fees')
    month       = models.CharField(max_length=20)
    amount      = models.DecimalField(max_digits=8, decimal_places=2)
    due_date    = models.DateField()
    paid_date   = models.DateField(null=True, blank=True)
    status      = models.CharField(max_length=10, choices=STATUS, default='pending')
    remarks     = models.CharField(max_length=200, blank=True)

    def __str__(self): return f"{self.allotment.student_name} — {self.month} — {self.status}"


class Visitor(models.Model):
    student_name  = models.CharField(max_length=200)
    student_id    = models.CharField(max_length=50, blank=True)
    visitor_name  = models.CharField(max_length=200)
    relation      = models.CharField(max_length=100, blank=True)
    contact       = models.CharField(max_length=20, blank=True)
    purpose       = models.CharField(max_length=300, blank=True)
    check_in      = models.DateTimeField()
    check_out     = models.DateTimeField(null=True, blank=True)

    def __str__(self): return f"{self.visitor_name} visiting {self.student_name}"


class LeaveRequest(models.Model):
    STATUS = [('pending','Pending'),('approved','Approved'),('rejected','Rejected')]
    student_name  = models.CharField(max_length=200)
    student_id    = models.CharField(max_length=50, blank=True)
    room          = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='leave_requests')
    from_date     = models.DateField()
    to_date       = models.DateField()
    reason        = models.TextField()
    status        = models.CharField(max_length=10, choices=STATUS, default='pending')
    applied_on    = models.DateTimeField(auto_now_add=True)
    remarks       = models.CharField(max_length=300, blank=True)

    def __str__(self): return f"{self.student_name} — {self.from_date} to {self.to_date}"


class HostelComplaint(models.Model):
    STATUS = [('open','Open'),('in_progress','In Progress'),('resolved','Resolved')]
    room         = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True)
    student_name = models.CharField(max_length=200)
    complaint    = models.TextField()
    status       = models.CharField(max_length=20, choices=STATUS, default='open')
    filed_on     = models.DateTimeField(auto_now_add=True)
    resolved_on  = models.DateTimeField(null=True, blank=True)

    def __str__(self): return f"{self.student_name} — {self.status}"


class HostelApplication(models.Model):
    STATUS = [('pending','Pending'),('approved','Approved'),('rejected','Rejected')]
    student_name    = models.CharField(max_length=200)
    student_id      = models.CharField(max_length=50, blank=True)
    contact         = models.CharField(max_length=20, blank=True)
    gender          = models.CharField(max_length=10, choices=[('male','Male'),('female','Female')], default='male')
    preferred_block = models.ForeignKey(HostelBlock, on_delete=models.SET_NULL, null=True, blank=True)
    reason          = models.TextField(blank=True)
    applied_on      = models.DateTimeField(auto_now_add=True)
    status          = models.CharField(max_length=10, choices=STATUS, default='pending')
    remarks         = models.CharField(max_length=300, blank=True)

    def __str__(self): return f"{self.student_name} — {self.status}"


class HostelAttendance(models.Model):
    allotment = models.ForeignKey(HostelAllotment, on_delete=models.CASCADE, related_name='attendance')
    date      = models.DateField()
    check_in  = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    present   = models.BooleanField(default=True)
    remarks   = models.CharField(max_length=200, blank=True)

    class Meta: unique_together = ('allotment', 'date')
    def __str__(self): return f"{self.allotment.student_name} — {self.date}"
