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

    def validate(self, attrs):
        student = attrs.get('student')
        fee_structure = attrs.get('fee_structure')
        fee_type = attrs.get('fee_type', '')

        # Determine fee type
        f_type = fee_type.lower() if fee_type else ''
        if fee_structure:
            f_type = fee_structure.fee_type.lower()

        if 'transport' in f_type and student:
            from hostel.models import HostelAllotment
            is_hosteler = HostelAllotment.objects.filter(
                student_id__in=[student.roll_number, student.register_number],
                status='active'
            ).exists()
            if is_hosteler:
                raise serializers.ValidationError("Hostel students cannot be charged a Transport Fee.")

        # Ensure students and parents can only access/manage their own / child's fees
        target_student = student or (self.instance.student if self.instance else None)
        request = self.context.get('request')
        if request and request.user:
            user = request.user
            if user.role == 'student' and target_student and target_student.id != user.linked_student_id:
                raise serializers.ValidationError("Students can only manage their own fees.")
            if user.role == 'parent' and target_student and target_student.id != user.linked_student_id:
                raise serializers.ValidationError("Parents can only manage their child's fees.")

        return attrs
