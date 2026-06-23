from django.contrib import admin
from .models import AttendanceSession, StudentAttendance

@admin.register(AttendanceSession)
class AttendanceSessionAdmin(admin.ModelAdmin):
    list_display = ('date', 'course', 'department', 'subject', 'faculty_name', 'period')
    list_filter = ('date', 'course', 'department', 'period')
    search_fields = ('subject', 'faculty_name')

@admin.register(StudentAttendance)
class StudentAttendanceAdmin(admin.ModelAdmin):
    list_display = ('session', 'student', 'status')
    list_filter = ('status',)
    search_fields = ('student__first_name', 'student__last_name', 'student__roll_number')
