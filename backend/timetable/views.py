from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from .models import TimetableEntry
from .serializers import TimetableEntrySerializer


class TimetableViewSet(viewsets.ModelViewSet):
    queryset = TimetableEntry.objects.all()
    serializer_class = TimetableEntrySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['course', 'subject', 'faculty_name', 'day']

    def get_queryset(self):
        qs = super().get_queryset()
        p = self.request.query_params
        if p.get('course'):        qs = qs.filter(course=p['course'])
        if p.get('semester'):      qs = qs.filter(semester=p['semester'])
        if p.get('day'):           qs = qs.filter(day=p['day'])
        if p.get('academic_year'): qs = qs.filter(academic_year=p['academic_year'])
        return qs
