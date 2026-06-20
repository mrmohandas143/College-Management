from django.contrib import admin
from .models import Faculty

@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'department', 'designation', 'status']
    search_fields = ['first_name', 'last_name', 'email', 'department']
    list_filter = ['status', 'department']
