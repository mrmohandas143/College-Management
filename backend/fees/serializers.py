from rest_framework import serializers
from .models import Fee, FeeStructure


class FeeStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeStructure
        fields = '__all__'


class FeeSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_roll = serializers.SerializerMethodField()
    student_course = serializers.SerializerMethodField()
    student_department = serializers.SerializerMethodField()

    class Meta:
        model = Fee
        fields = '__all__'

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

    def get_student_roll(self, obj):
        return obj.student.register_number

    def get_student_course(self, obj):
        return obj.student.course

    def get_student_department(self, obj):
        return getattr(obj.student, 'department', '')
