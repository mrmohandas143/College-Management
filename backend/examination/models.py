from django.db import models
from students.models import Student


class Exam(models.Model):
    TYPE = [('internal','Internal'),('external','External'),('practical','Practical'),('viva','Viva')]
    STATUS = [('scheduled','Scheduled'),('ongoing','Ongoing'),('completed','Completed'),('cancelled','Cancelled')]
    name         = models.CharField(max_length=200)
    exam_type    = models.CharField(max_length=20, choices=TYPE, default='internal')
    course       = models.CharField(max_length=100)
    department   = models.CharField(max_length=100, blank=True)
    semester     = models.PositiveIntegerField(default=1)
    subject      = models.CharField(max_length=200)
    subject_code = models.CharField(max_length=20, blank=True)
    exam_date    = models.DateField()
    start_time   = models.TimeField(null=True, blank=True)
    end_time     = models.TimeField(null=True, blank=True)
    room         = models.CharField(max_length=50, blank=True)
    max_marks    = models.PositiveIntegerField(default=100)
    pass_marks   = models.PositiveIntegerField(default=40)
    status       = models.CharField(max_length=20, choices=STATUS, default='scheduled')
    academic_year = models.CharField(max_length=20, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} | {self.subject} | {self.exam_date}"


class ExamResult(models.Model):
    GRADE_CHOICES = [('O','O'),('A+','A+'),('A','A'),('B+','B+'),('B','B'),('C','C'),('F','F'),('AB','AB')]
    exam         = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='results')
    student      = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='exam_results')
    marks_obtained = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    grade        = models.CharField(max_length=5, choices=GRADE_CHOICES, blank=True)
    is_pass      = models.BooleanField(default=False)
    remarks      = models.CharField(max_length=200, blank=True)
    entered_by   = models.CharField(max_length=100, blank=True)
    entered_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('exam', 'student')

    def save(self, *args, **kwargs):
        self.is_pass = self.marks_obtained >= self.exam.pass_marks
        pct = (self.marks_obtained / self.exam.max_marks) * 100 if self.exam.max_marks else 0
        if pct >= 90:   self.grade = 'O'
        elif pct >= 80: self.grade = 'A+'
        elif pct >= 70: self.grade = 'A'
        elif pct >= 60: self.grade = 'B+'
        elif pct >= 50: self.grade = 'B'
        elif pct >= 40: self.grade = 'C'
        else:           self.grade = 'F'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student} | {self.exam.subject} | {self.marks_obtained}"
