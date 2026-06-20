from django.db import models


class Company(models.Model):
    name     = models.CharField(max_length=200)
    industry = models.CharField(max_length=100, blank=True)
    website  = models.URLField(blank=True)
    contact_person = models.CharField(max_length=100, blank=True)
    contact_email  = models.EmailField(blank=True)
    contact_phone  = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.name


class PlacementDrive(models.Model):
    STATUS = [('upcoming','Upcoming'),('ongoing','Ongoing'),('completed','Completed'),('cancelled','Cancelled')]
    company      = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='drives')
    title        = models.CharField(max_length=200)
    drive_date   = models.DateField()
    venue        = models.CharField(max_length=200, blank=True)
    package_lpa  = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    eligible_courses = models.CharField(max_length=300, blank=True)
    min_cgpa     = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    status       = models.CharField(max_length=20, choices=STATUS, default='upcoming')
    description  = models.TextField(blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    def __str__(self): return f"{self.company.name} — {self.title}"


class PlacementApplication(models.Model):
    STATUS = [('applied','Applied'),('shortlisted','Shortlisted'),('selected','Selected'),('rejected','Rejected')]
    drive        = models.ForeignKey(PlacementDrive, on_delete=models.CASCADE, related_name='applications')
    student_name = models.CharField(max_length=200)
    student_id   = models.CharField(max_length=50, blank=True)
    course       = models.CharField(max_length=100, blank=True)
    cgpa         = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    status       = models.CharField(max_length=20, choices=STATUS, default='applied')
    applied_on   = models.DateTimeField(auto_now_add=True)
    offer_letter = models.BooleanField(default=False)
    package_lpa  = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    def __str__(self): return f"{self.student_name} → {self.drive}"
