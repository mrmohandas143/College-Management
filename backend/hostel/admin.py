from django.contrib import admin
from .models import HostelBlock, Room, HostelAllotment, HostelFee, Visitor, LeaveRequest, HostelComplaint, HostelApplication, HostelAttendance

@admin.register(HostelBlock)
class HostelBlockAdmin(admin.ModelAdmin):
    list_display = ('name', 'gender', 'warden', 'capacity')
    search_fields = ('name', 'warden')

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('block', 'room_number', 'room_type', 'capacity', 'occupied', 'status', 'floor')
    list_filter = ('block', 'room_type', 'status', 'floor')
    search_fields = ('room_number',)

@admin.register(HostelAllotment)
class HostelAllotmentAdmin(admin.ModelAdmin):
    list_display = ('room', 'student_name', 'student_id', 'contact', 'allotment_date', 'vacating_date', 'status')
    list_filter = ('status', 'allotment_date')
    search_fields = ('student_name', 'student_id')

@admin.register(HostelFee)
class HostelFeeAdmin(admin.ModelAdmin):
    list_display = ('allotment', 'month', 'amount', 'due_date', 'paid_date', 'status')
    list_filter = ('status', 'month')
    search_fields = ('allotment__student_name', 'allotment__student_id')

@admin.register(Visitor)
class VisitorAdmin(admin.ModelAdmin):
    list_display = ('student_name', 'student_id', 'visitor_name', 'relation', 'contact', 'check_in', 'check_out')
    search_fields = ('student_name', 'student_id', 'visitor_name')

@admin.register(LeaveRequest)
class HostelLeaveRequestAdmin(admin.ModelAdmin):
    list_display = ('student_name', 'student_id', 'room', 'from_date', 'to_date', 'status')
    list_filter = ('status', 'from_date')
    search_fields = ('student_name', 'student_id')

@admin.register(HostelComplaint)
class HostelComplaintAdmin(admin.ModelAdmin):
    list_display = ('room', 'student_name', 'status', 'filed_on', 'resolved_on')
    list_filter = ('status', 'filed_on')
    search_fields = ('student_name', 'complaint')

@admin.register(HostelApplication)
class HostelApplicationAdmin(admin.ModelAdmin):
    list_display = ('student_name', 'student_id', 'contact', 'gender', 'preferred_block', 'status')
    list_filter = ('status', 'gender')
    search_fields = ('student_name', 'student_id')

@admin.register(HostelAttendance)
class HostelAttendanceAdmin(admin.ModelAdmin):
    list_display = ('allotment', 'date', 'check_in', 'check_out', 'present')
    list_filter = ('date', 'present')
    search_fields = ('allotment__student_name', 'allotment__student_id')
