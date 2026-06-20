from django.db import models


class BookCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    def __str__(self): return self.name


class Book(models.Model):
    STATUS = [('available', 'Available'), ('issued', 'Issued'), ('lost', 'Lost')]
    title       = models.CharField(max_length=200)
    author      = models.CharField(max_length=200)
    isbn        = models.CharField(max_length=20, unique=True, blank=True)
    category    = models.ForeignKey(BookCategory, on_delete=models.SET_NULL, null=True, blank=True)
    publisher   = models.CharField(max_length=200, blank=True)
    edition     = models.CharField(max_length=50, blank=True)
    total_copies   = models.PositiveIntegerField(default=1)
    available_copies = models.PositiveIntegerField(default=1)
    rack_number = models.CharField(max_length=20, blank=True)
    status      = models.CharField(max_length=20, choices=STATUS, default='available')
    added_on    = models.DateField(auto_now_add=True)

    def __str__(self): return f"{self.title} — {self.author}"


class BookIssue(models.Model):
    STATUS = [('issued', 'Issued'), ('returned', 'Returned'), ('overdue', 'Overdue')]
    book        = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='issues')
    member_name = models.CharField(max_length=200)
    member_type = models.CharField(max_length=20, choices=[('student','Student'),('faculty','Faculty'),('staff','Staff')], default='student')
    member_id   = models.CharField(max_length=50, blank=True)
    issue_date  = models.DateField()
    due_date    = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    fine_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    status      = models.CharField(max_length=20, choices=STATUS, default='issued')

    def __str__(self): return f"{self.book.title} → {self.member_name}"
