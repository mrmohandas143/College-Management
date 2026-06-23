from django.contrib import admin
from .models import Route, Vehicle, TransportAllotment

@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_point', 'end_point', 'distance_km', 'fare')
    search_fields = ('name', 'start_point', 'end_point')

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('reg_number', 'vehicle_type', 'capacity', 'driver_name', 'driver_phone', 'route', 'status')
    list_filter = ('vehicle_type', 'status', 'route')
    search_fields = ('reg_number', 'driver_name')

@admin.register(TransportAllotment)
class TransportAllotmentAdmin(admin.ModelAdmin):
    list_display = ('student_name', 'student_id', 'route', 'vehicle', 'boarding_stop', 'valid_from', 'is_active')
    list_filter = ('is_active', 'valid_from')
    search_fields = ('student_name', 'student_id')
