from django.contrib import admin
from .models import Fee, FeeStructure


@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ['name', 'fee_type', 'course', 'department', 'semester', 'amount', 'is_active']
    list_filter = ['fee_type', 'is_active', 'course']
    search_fields = ['name', 'course', 'department']


@admin.register(Fee)
class FeeAdmin(admin.ModelAdmin):
    list_display = ['student', 'fee_type', 'amount', 'net_amount', 'status', 'due_date', 'paid_date']
    list_filter = ['status', 'fee_type', 'semester']
    search_fields = ['student__first_name', 'student__last_name', 'receipt_number']
