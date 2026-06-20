from django.db import models


class AlumniProfile(models.Model):
    EMPLOYMENT = [('employed','Employed'),('self_employed','Self Employed'),('higher_studies','Higher Studies'),('unemployed','Unemployed')]
    first_name    = models.CharField(max_length=100)
    last_name     = models.CharField(max_length=100)
    email         = models.EmailField(unique=True)
    phone         = models.CharField(max_length=20, blank=True)
    batch_year    = models.PositiveIntegerField()
    course        = models.CharField(max_length=100)
    department    = models.CharField(max_length=100, blank=True)
    current_company = models.CharField(max_length=200, blank=True)
    designation   = models.CharField(max_length=200, blank=True)
    location      = models.CharField(max_length=200, blank=True)
    linkedin      = models.URLField(blank=True)
    employment_status = models.CharField(max_length=20, choices=EMPLOYMENT, default='employed')
    is_verified   = models.BooleanField(default=False)
    registered_on = models.DateTimeField(auto_now_add=True)

    def __str__(self): return f"{self.first_name} {self.last_name} ({self.batch_year})"


class AlumniEvent(models.Model):
    STATUS = [('upcoming','Upcoming'),('ongoing','Ongoing'),('completed','Completed')]
    title       = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    event_date  = models.DateField()
    venue       = models.CharField(max_length=200, blank=True)
    status      = models.CharField(max_length=20, choices=STATUS, default='upcoming')
    created_at  = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.title


class AlumniEventRegistration(models.Model):
    event   = models.ForeignKey(AlumniEvent, on_delete=models.CASCADE, related_name='registrations')
    alumni  = models.ForeignKey(AlumniProfile, on_delete=models.CASCADE, related_name='event_registrations')
    registered_on = models.DateTimeField(auto_now_add=True)
    attended = models.BooleanField(default=False)
    class Meta: unique_together = ('event', 'alumni')
