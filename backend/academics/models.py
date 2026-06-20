from django.db import models


class Subject(models.Model):
    name        = models.CharField(max_length=200)
    code        = models.CharField(max_length=20, unique=True)
    course      = models.CharField(max_length=100)
    department  = models.CharField(max_length=100, blank=True)
    semester    = models.PositiveIntegerField(default=1)
    credits     = models.PositiveIntegerField(default=3)
    subject_type = models.CharField(max_length=20, choices=[('theory','Theory'),('practical','Practical'),('elective','Elective')], default='theory')
    faculty_name = models.CharField(max_length=200, blank=True)
    is_active   = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class AcademicCalendar(models.Model):
    EVENT_TYPE = [('holiday','Holiday'),('exam','Exam'),('event','Event'),('semester_start','Semester Start'),('semester_end','Semester End')]
    title       = models.CharField(max_length=200)
    event_type  = models.CharField(max_length=20, choices=EVENT_TYPE, default='event')
    start_date  = models.DateField()
    end_date    = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True)
    academic_year = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.title} ({self.start_date})"
