from rest_framework import serializers
from .models import Subject, AcademicCalendar

class SubjectSerializer(serializers.ModelSerializer):
    class Meta: model = Subject; fields = '__all__'

class AcademicCalendarSerializer(serializers.ModelSerializer):
    class Meta: model = AcademicCalendar; fields = '__all__'
