from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import AlumniProfile, AlumniEvent, AlumniEventRegistration
from .serializers import AlumniProfileSerializer, AlumniEventSerializer, AlumniEventRegistrationSerializer
from accounts.permissions import IsAlumniCoordinator


class AlumniProfileViewSet(viewsets.ModelViewSet):
    queryset = AlumniProfile.objects.all().order_by('-batch_year')
    serializer_class = AlumniProfileSerializer
    permission_classes = [IsAlumniCoordinator]
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'email', 'course', 'current_company', 'batch_year']

    def get_queryset(self):
        qs = super().get_queryset()
        batch  = self.request.query_params.get('batch_year')
        course = self.request.query_params.get('course')
        if batch:  qs = qs.filter(batch_year=batch)
        if course: qs = qs.filter(course__icontains=course)
        return qs

    @action(detail=False, methods=['get'])
    def stats(self, request):
        return Response({
            'total_alumni':    AlumniProfile.objects.count(),
            'verified':        AlumniProfile.objects.filter(is_verified=True).count(),
            'employed':        AlumniProfile.objects.filter(employment_status='employed').count(),
            'higher_studies':  AlumniProfile.objects.filter(employment_status='higher_studies').count(),
            'total_events':    AlumniEvent.objects.count(),
            'upcoming_events': AlumniEvent.objects.filter(status='upcoming').count(),
        })


class AlumniEventViewSet(viewsets.ModelViewSet):
    queryset = AlumniEvent.objects.all().order_by('-event_date')
    serializer_class = AlumniEventSerializer
    permission_classes = [IsAlumniCoordinator]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'venue', 'status']


class AlumniEventRegistrationViewSet(viewsets.ModelViewSet):
    queryset = AlumniEventRegistration.objects.select_related('event', 'alumni').all()
    serializer_class = AlumniEventRegistrationSerializer
    permission_classes = [IsAlumniCoordinator]

    def get_queryset(self):
        qs = super().get_queryset()
        event = self.request.query_params.get('event')
        if event: qs = qs.filter(event_id=event)
        return qs
