from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Subject, AcademicCalendar
from .serializers import SubjectSerializer, AcademicCalendarSerializer
from accounts.permissions import IsAdminOrFaculty


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all().order_by('course', 'semester', 'name')
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'code', 'course', 'faculty_name']

    def get_queryset(self):
        qs = super().get_queryset()
        p = self.request.query_params
        if p.get('course'):   qs = qs.filter(course=p['course'])
        if p.get('semester'): qs = qs.filter(semester=p['semester'])
        return qs


class AcademicCalendarViewSet(viewsets.ModelViewSet):
    queryset = AcademicCalendar.objects.all().order_by('start_date')
    serializer_class = AcademicCalendarSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'event_type', 'academic_year']

    def get_queryset(self):
        qs = super().get_queryset()
        p = self.request.query_params
        if p.get('event_type'):   qs = qs.filter(event_type=p['event_type'])
        if p.get('academic_year'): qs = qs.filter(academic_year=p['academic_year'])
        return qs
