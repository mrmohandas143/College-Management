from rest_framework import serializers
from .models import Employee, Attendance, LeaveRequest, PayrollConfig, Payroll
from departments.models import Department


class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Employee
        fields = '__all__'


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.__str__', read_only=True)

    class Meta:
        model = Attendance
        fields = '__all__'


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.__str__', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ['days']


class PayrollConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollConfig
        fields = '__all__'


class PayrollSerializer(serializers.ModelSerializer):
    employee_name   = serializers.CharField(source='employee.__str__', read_only=True)
    department_name = serializers.CharField(source='employee.department.name', read_only=True)
    month_name      = serializers.SerializerMethodField()

    def get_month_name(self, obj):
        import calendar
        return calendar.month_name[obj.month]

    class Meta:
        model  = Payroll
        fields = '__all__'
