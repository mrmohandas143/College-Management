from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Company, PlacementDrive, PlacementApplication
from .serializers import CompanySerializer, PlacementDriveSerializer, PlacementApplicationSerializer
from accounts.permissions import IsPlacementOfficer


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all().order_by('-created_at')
    serializer_class = CompanySerializer
    permission_classes = [IsPlacementOfficer]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'industry', 'contact_person']


class PlacementDriveViewSet(viewsets.ModelViewSet):
    queryset = PlacementDrive.objects.select_related('company').all().order_by('-drive_date')
    serializer_class = PlacementDriveSerializer
    permission_classes = [IsPlacementOfficer]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'company__name', 'status']

    def get_queryset(self):
        qs = super().get_queryset()
        status = self.request.query_params.get('status')
        if status: qs = qs.filter(status=status)
        return qs

    @action(detail=False, methods=['get'])
    def stats(self, request):
        return Response({
            'total_companies':    Company.objects.count(),
            'total_drives':       PlacementDrive.objects.count(),
            'upcoming_drives':    PlacementDrive.objects.filter(status='upcoming').count(),
            'completed_drives':   PlacementDrive.objects.filter(status='completed').count(),
            'total_applications': PlacementApplication.objects.count(),
            'total_selected':     PlacementApplication.objects.filter(status='selected').count(),
            'offer_letters':      PlacementApplication.objects.filter(offer_letter=True).count(),
        })


class PlacementApplicationViewSet(viewsets.ModelViewSet):
    queryset = PlacementApplication.objects.select_related('drive__company').all().order_by('-applied_on')
    serializer_class = PlacementApplicationSerializer
    permission_classes = [IsPlacementOfficer]
    filter_backends = [filters.SearchFilter]
    search_fields = ['student_name', 'student_id', 'drive__title', 'status']

    def get_queryset(self):
        qs = super().get_queryset()
        drive  = self.request.query_params.get('drive')
        status = self.request.query_params.get('status')
        if drive:  qs = qs.filter(drive_id=drive)
        if status: qs = qs.filter(status=status)
        return qs
