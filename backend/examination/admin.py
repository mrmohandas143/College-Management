from django.contrib import admin
from .models import Exam, ExamResult

@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ('name', 'exam_type', 'course', 'department', 'semester', 'subject', 'exam_date', 'status')
    list_filter = ('exam_type', 'course', 'department', 'semester', 'status')
    search_fields = ('name', 'subject', 'subject_code')

@admin.register(ExamResult)
class ExamResultAdmin(admin.ModelAdmin):
    list_display = ('exam', 'student', 'marks_obtained', 'grade', 'is_pass')
    list_filter = ('grade', 'is_pass')
    search_fields = ('student__first_name', 'student__last_name', 'student__roll_number', 'exam__name')
