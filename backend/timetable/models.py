from django.db import models


class TimetableEntry(models.Model):
    DAYS = [('monday','Monday'),('tuesday','Tuesday'),('wednesday','Wednesday'),('thursday','Thursday'),('friday','Friday'),('saturday','Saturday')]
    course      = models.CharField(max_length=100)
    department  = models.CharField(max_length=100, blank=True)
    semester    = models.PositiveIntegerField(default=1)
    day         = models.CharField(max_length=15, choices=DAYS)
    period      = models.PositiveIntegerField()
    start_time  = models.TimeField()
    end_time    = models.TimeField()
    subject     = models.CharField(max_length=200)
    subject_code = models.CharField(max_length=20, blank=True)
    faculty_name = models.CharField(max_length=200, blank=True)
    room        = models.CharField(max_length=50, blank=True)
    academic_year = models.CharField(max_length=20, blank=True)

    class Meta:
        unique_together = ('course', 'semester', 'day', 'period', 'academic_year')
        ordering = ['day', 'period']

    def __str__(self):
        return f"{self.course} | {self.day} | P{self.period} | {self.subject}"
