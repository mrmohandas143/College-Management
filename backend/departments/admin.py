# pyrefly: ignore [missing-import]
from django.contrib import admin
from .models import Department

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'head', 'created_at')
    search_fields = ('name', 'code', 'head')
