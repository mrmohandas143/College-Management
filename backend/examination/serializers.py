from rest_framework import serializers
from .models import Exam, ExamResult

class ExamSerializer(serializers.ModelSerializer):
    results_count = serializers.SerializerMethodField()
    pass_count    = serializers.SerializerMethodField()
    def get_results_count(self, obj): return obj.results.count()
    def get_pass_count(self, obj):    return obj.results.filter(is_pass=True).count()
    class Meta: model = Exam; fields = '__all__'

class ExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.__str__', read_only=True)
    exam_name    = serializers.CharField(source='exam.name', read_only=True)
    subject      = serializers.CharField(source='exam.subject', read_only=True)
    max_marks    = serializers.IntegerField(source='exam.max_marks', read_only=True)
    class Meta: model = ExamResult; fields = '__all__'
