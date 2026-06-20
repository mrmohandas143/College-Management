from django.contrib import admin
from .models import Employee, Attendance, LeaveRequest, PayrollConfig, Payroll

admin.site.register(Employee)
admin.site.register(Attendance)
admin.site.register(LeaveRequest)
admin.site.register(PayrollConfig)
admin.site.register(Payroll)
