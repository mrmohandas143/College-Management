from django.contrib import admin
from .models import Company, PlacementDrive, PlacementApplication

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'industry', 'website', 'contact_person', 'contact_email')
    search_fields = ('name', 'industry')

@admin.register(PlacementDrive)
class PlacementDriveAdmin(admin.ModelAdmin):
    list_display = ('company', 'title', 'drive_date', 'venue', 'package_lpa', 'min_cgpa', 'status')
    list_filter = ('status', 'drive_date')
    search_fields = ('title', 'company__name')

@admin.register(PlacementApplication)
class PlacementApplicationAdmin(admin.ModelAdmin):
    list_display = ('drive', 'student_name', 'student_id', 'course', 'cgpa', 'status', 'offer_letter', 'package_lpa')
    list_filter = ('status', 'offer_letter')
    search_fields = ('student_name', 'student_id', 'drive__title')
