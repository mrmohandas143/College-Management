from django.contrib import admin
from .models import AlumniProfile, AlumniEvent, AlumniEventRegistration

@admin.register(AlumniProfile)
class AlumniProfileAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'email', 'batch_year', 'course', 'department', 'current_company', 'employment_status', 'is_verified')
    list_filter = ('batch_year', 'course', 'employment_status', 'is_verified')
    search_fields = ('first_name', 'last_name', 'email', 'current_company')

@admin.register(AlumniEvent)
class AlumniEventAdmin(admin.ModelAdmin):
    list_display = ('title', 'event_date', 'venue', 'status')
    list_filter = ('status', 'event_date')
    search_fields = ('title', 'venue')

@admin.register(AlumniEventRegistration)
class AlumniEventRegistrationAdmin(admin.ModelAdmin):
    list_display = ('event', 'alumni', 'registered_on', 'attended')
    list_filter = ('attended',)
    search_fields = ('alumni__first_name', 'alumni__last_name', 'event__title')
