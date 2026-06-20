from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import AttendanceSession, StudentAttendance
from .serializers import AttendanceSessionSerializer, StudentAttendanceSerializer
from accounts.permissions import IsAdminOrFaculty


class AttendanceSessionViewSet(viewsets.ModelViewSet):
    queryset = AttendanceSession.objects.all().order_by('-date')
    serializer_class = AttendanceSessionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['course', 'subject', 'faculty_name']

    def get_queryset(self):
        qs = super().get_queryset()
        p = self.request.query_params
        if p.get('course'): qs = qs.filter(course=p['course'])
        if p.get('date'):   qs = qs.filter(date=p['date'])
        if p.get('month'):  qs = qs.filter(date__month=p['month'])
        if p.get('year'):   qs = qs.filter(date__year=p['year'])
        return qs

    @action(detail=True, methods=['post'])
    def bulk_mark(self, request, pk=None):
        session = self.get_object()
        records = request.data.get('records', [])
        created = updated = 0
        for rec in records:
            _, is_new = StudentAttendance.objects.update_or_create(
                session=session, student_id=rec['student'],
                defaults={'status': rec['status'], 'remarks': rec.get('remarks', '')}
            )
            if is_new: created += 1
            else:      updated += 1
        return Response({'created': created, 'updated': updated})

    @action(detail=False, methods=['get'])
    def student_summary(self, request):
        student_id = request.query_params.get('student')
        if not student_id:
            return Response({'error': 'student param required'}, status=400)
        records = StudentAttendance.objects.filter(student_id=student_id)
        total   = records.count()
        present = records.filter(status='present').count()
        absent  = records.filter(status='absent').count()
        late    = records.filter(status='late').count()
        pct     = round((present / total) * 100, 1) if total else 0
        return Response({'total': total, 'present': present, 'absent': absent, 'late': late, 'percentage': pct})


class StudentAttendanceViewSet(viewsets.ModelViewSet):
    queryset = StudentAttendance.objects.select_related('session', 'student').all()
    serializer_class = StudentAttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        p = self.request.query_params
        if p.get('student'): qs = qs.filter(student_id=p['student'])
        if p.get('session'): qs = qs.filter(session_id=p['session'])
        if p.get('status'):  qs = qs.filter(status=p['status'])
        return qs
