# pyrefly: ignore [missing-import]
from rest_framework import serializers
from .models import Student


class StudentSerializer(serializers.ModelSerializer):
    is_hosteler = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = '__all__'
        extra_kwargs = {
            'roll_number': {'required': False},  # auto-synced from register_number
        }

    def get_is_hosteler(self, obj):
        from hostel.models import HostelAllotment
        return HostelAllotment.objects.filter(
            student_id__in=[obj.roll_number, obj.register_number],
            status='active'
        ).exists()

    def validate_register_number(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Register number is required.')
        return value.strip()

    def validate(self, attrs):
        # Ensure roll_number is always set to register_number before DB hit
        reg = attrs.get('register_number', '')
        if reg:
            attrs['roll_number'] = reg
        return attrs
