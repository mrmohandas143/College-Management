from django.db import models


class Route(models.Model):
    name        = models.CharField(max_length=200)
    start_point = models.CharField(max_length=200)
    end_point   = models.CharField(max_length=200)
    distance_km = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    stops       = models.TextField(blank=True, help_text='Comma-separated stop names')
    fare        = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    def __str__(self): return self.name


class Vehicle(models.Model):
    STATUS = [('active','Active'),('maintenance','Maintenance'),('inactive','Inactive')]
    reg_number  = models.CharField(max_length=20, unique=True)
    vehicle_type = models.CharField(max_length=50, default='Bus')
    capacity    = models.PositiveIntegerField(default=40)
    driver_name = models.CharField(max_length=100, blank=True)
    driver_phone = models.CharField(max_length=20, blank=True)
    route       = models.ForeignKey(Route, on_delete=models.SET_NULL, null=True, blank=True, related_name='vehicles')
    status      = models.CharField(max_length=20, choices=STATUS, default='active')
    def __str__(self): return self.reg_number


class TransportAllotment(models.Model):
    student_name = models.CharField(max_length=200)
    student_id   = models.CharField(max_length=50, blank=True)
    route        = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='allotments')
    vehicle      = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, blank=True)
    boarding_stop = models.CharField(max_length=200, blank=True)
    valid_from   = models.DateField()
    valid_to     = models.DateField(null=True, blank=True)
    is_active    = models.BooleanField(default=True)
    def __str__(self): return f"{self.student_name} — {self.route}"
