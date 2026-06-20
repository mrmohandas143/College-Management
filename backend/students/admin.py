from django.contrib import admin
from .models import Student

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['register_number', 'first_name', 'last_name', 'course', 'year', 'status']
    search_fields = ['first_name', 'last_name', 'email', 'register_number']
    list_filter = ['status', 'course', 'year']
