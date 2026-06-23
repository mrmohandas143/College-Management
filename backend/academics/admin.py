from django.contrib import admin
from .models import Subject, AcademicCalendar

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'course', 'department', 'semester', 'credits', 'subject_type', 'faculty_name', 'is_active')
    list_filter = ('course', 'department', 'semester', 'subject_type', 'is_active')
    search_fields = ('code', 'name', 'faculty_name')

@admin.register(AcademicCalendar)
class AcademicCalendarAdmin(admin.ModelAdmin):
    list_display = ('title', 'event_type', 'start_date', 'end_date', 'academic_year')
    list_filter = ('event_type', 'academic_year')
    search_fields = ('title', 'description')
