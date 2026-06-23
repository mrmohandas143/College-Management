from django.contrib import admin
from .models import TimetableEntry

@admin.register(TimetableEntry)
class TimetableEntryAdmin(admin.ModelAdmin):
    list_display = ('course', 'department', 'semester', 'day', 'period', 'start_time', 'end_time', 'subject', 'faculty_name', 'room')
    list_filter = ('course', 'department', 'semester', 'day', 'period')
    search_fields = ('subject', 'faculty_name', 'room')
