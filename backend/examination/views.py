from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Exam, ExamResult
from .serializers import ExamSerializer, ExamResultSerializer
from accounts.permissions import IsAdminOrFaculty


class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all().order_by('-exam_date')
    serializer_class = ExamSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'subject', 'course', 'status']

    def get_queryset(self):
        qs = super().get_queryset()
        p = self.request.query_params
        if p.get('course'):    qs = qs.filter(course=p['course'])
        if p.get('semester'):  qs = qs.filter(semester=p['semester'])
        if p.get('status'):    qs = qs.filter(status=p['status'])
        return qs

    @action(detail=False, methods=['get'])
    def stats(self, request):
        from django.db.models import Avg
        return Response({
            'total_exams':     Exam.objects.count(),
            'scheduled':       Exam.objects.filter(status='scheduled').count(),
            'completed':       Exam.objects.filter(status='completed').count(),
            'total_results':   ExamResult.objects.count(),
            'pass_count':      ExamResult.objects.filter(is_pass=True).count(),
            'fail_count':      ExamResult.objects.filter(is_pass=False).count(),
        })


class ExamResultViewSet(viewsets.ModelViewSet):
    queryset = ExamResult.objects.select_related('exam', 'student').all()
    serializer_class = ExamResultSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['student__first_name', 'student__last_name', 'exam__subject', 'grade']

    def get_queryset(self):
        qs = super().get_queryset()
        p = self.request.query_params
        if p.get('exam'):    qs = qs.filter(exam_id=p['exam'])
        if p.get('student'): qs = qs.filter(student_id=p['student'])
        if p.get('grade'):   qs = qs.filter(grade=p['grade'])
        return qs
