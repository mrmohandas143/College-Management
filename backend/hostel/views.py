from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import HostelBlock, Room, HostelAllotment, HostelFee, Visitor, LeaveRequest, HostelComplaint, HostelApplication, HostelAttendance
from .serializers import (HostelBlockSerializer, RoomSerializer, HostelAllotmentSerializer,
                          HostelFeeSerializer, VisitorSerializer, LeaveRequestSerializer,
                          HostelComplaintSerializer, HostelApplicationSerializer, HostelAttendanceSerializer)
from accounts.permissions import IsHostelWarden


class HostelBlockViewSet(viewsets.ModelViewSet):
    queryset = HostelBlock.objects.all().order_by('name')
    serializer_class = HostelBlockSerializer
    permission_classes = [IsHostelWarden]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        return Response({
            'total_blocks':        HostelBlock.objects.count(),
            'total_rooms':         Room.objects.count(),
            'available_rooms':     Room.objects.filter(status='available').count(),
            'occupied_rooms':      Room.objects.filter(status='occupied').count(),
            'maintenance_rooms':   Room.objects.filter(status='maintenance').count(),
            'total_allotments':    HostelAllotment.objects.filter(status='active').count(),
            'open_complaints':     HostelComplaint.objects.filter(status='open').count(),
            'pending_leaves':      LeaveRequest.objects.filter(status='pending').count(),
            'pending_fees':        HostelFee.objects.filter(status='pending').count(),
            'overdue_fees':        HostelFee.objects.filter(status='overdue').count(),
            'pending_applications':HostelApplication.objects.filter(status='pending').count(),
        })

    @action(detail=False, methods=['get'])
    def reports(self, request):
        return Response({
            'allotments_active':   HostelAllotment.objects.filter(status='active').count(),
            'allotments_vacated':  HostelAllotment.objects.filter(status='vacated').count(),
            'fees_paid':           HostelFee.objects.filter(status='paid').count(),
            'fees_pending':        HostelFee.objects.filter(status='pending').count(),
            'fees_overdue':        HostelFee.objects.filter(status='overdue').count(),
            'leaves_approved':     LeaveRequest.objects.filter(status='approved').count(),
            'leaves_pending':      LeaveRequest.objects.filter(status='pending').count(),
            'leaves_rejected':     LeaveRequest.objects.filter(status='rejected').count(),
            'complaints_open':     HostelComplaint.objects.filter(status='open').count(),
            'complaints_resolved': HostelComplaint.objects.filter(status='resolved').count(),
            'applications_pending':HostelApplication.objects.filter(status='pending').count(),
            'applications_approved':HostelApplication.objects.filter(status='approved').count(),
            'applications_rejected':HostelApplication.objects.filter(status='rejected').count(),
            'attendance_present':  HostelAttendance.objects.filter(present=True).count(),
            'attendance_absent':   HostelAttendance.objects.filter(present=False).count(),
        })


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.select_related('block').all().order_by('block__name', 'room_number')
    serializer_class = RoomSerializer
    permission_classes = [IsHostelWarden]
    filter_backends = [filters.SearchFilter]
    search_fields = ['room_number', 'block__name', 'status']

    def get_queryset(self):
        qs = super().get_queryset()
        block  = self.request.query_params.get('block')
        status = self.request.query_params.get('status')
        if block:  qs = qs.filter(block_id=block)
        if status: qs = qs.filter(status=status)
        return qs


class HostelAllotmentViewSet(viewsets.ModelViewSet):
    queryset = HostelAllotment.objects.select_related('room__block').all().order_by('-allotment_date')
    serializer_class = HostelAllotmentSerializer
    permission_classes = [IsHostelWarden]
    filter_backends = [filters.SearchFilter]
    search_fields = ['student_name', 'student_id', 'room__room_number']

    def get_queryset(self):
        qs = super().get_queryset()
        status = self.request.query_params.get('status')
        if status: qs = qs.filter(status=status)
        return qs

    def perform_create(self, serializer):
        allotment = serializer.save()
        room = allotment.room
        room.occupied = min(room.occupied + 1, room.capacity)
        room.status = 'occupied' if room.occupied >= room.capacity else 'available'
        room.save()

    @action(detail=True, methods=['post'])
    def vacate(self, request, pk=None):
        allotment = self.get_object()
        allotment.status = 'vacated'
        allotment.vacating_date = timezone.now().date()
        allotment.save()
        room = allotment.room
        room.occupied = max(room.occupied - 1, 0)
        room.status = 'available' if room.occupied == 0 else 'occupied'
        room.save()
        return Response({'message': f'{allotment.student_name} vacated successfully.'})


class HostelFeeViewSet(viewsets.ModelViewSet):
    queryset = HostelFee.objects.select_related('allotment__room__block').all().order_by('-due_date')
    serializer_class = HostelFeeSerializer
    permission_classes = [IsHostelWarden]
    filter_backends = [filters.SearchFilter]
    search_fields = ['allotment__student_name', 'month', 'status']

    def get_queryset(self):
        qs = super().get_queryset()
        status = self.request.query_params.get('status')
        if status: qs = qs.filter(status=status)
        return qs

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        fee = self.get_object()
        fee.status = 'paid'
        fee.paid_date = timezone.now().date()
        fee.save()
        return Response({'message': 'Fee marked as paid.'})


class VisitorViewSet(viewsets.ModelViewSet):
    queryset = Visitor.objects.all().order_by('-check_in')
    serializer_class = VisitorSerializer
    permission_classes = [IsHostelWarden]
    filter_backends = [filters.SearchFilter]
    search_fields = ['student_name', 'visitor_name', 'relation']

    @action(detail=True, methods=['post'])
    def checkout(self, request, pk=None):
        visitor = self.get_object()
        visitor.check_out = timezone.now()
        visitor.save()
        return Response({'message': f'{visitor.visitor_name} checked out.'})


class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all().order_by('-applied_on')
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsHostelWarden]
    filter_backends = [filters.SearchFilter]
    search_fields = ['student_name', 'student_id', 'status']

    def get_queryset(self):
        qs = super().get_queryset()
        status = self.request.query_params.get('status')
        if status: qs = qs.filter(status=status)
        return qs

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        leave = self.get_object()
        leave.status = 'approved'
        leave.remarks = request.data.get('remarks', '')
        leave.save()
        return Response({'message': 'Leave approved.'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        leave = self.get_object()
        leave.status = 'rejected'
        leave.remarks = request.data.get('remarks', '')
        leave.save()
        return Response({'message': 'Leave rejected.'})


class HostelComplaintViewSet(viewsets.ModelViewSet):
    queryset = HostelComplaint.objects.all().order_by('-filed_on')
    serializer_class = HostelComplaintSerializer
    permission_classes = [IsHostelWarden]
    filter_backends = [filters.SearchFilter]
    search_fields = ['student_name', 'complaint', 'status']


class HostelApplicationViewSet(viewsets.ModelViewSet):
    queryset = HostelApplication.objects.all().order_by('-applied_on')
    serializer_class = HostelApplicationSerializer
    permission_classes = [IsHostelWarden]
    filter_backends = [filters.SearchFilter]
    search_fields = ['student_name', 'student_id', 'status']

    def get_queryset(self):
        qs = super().get_queryset()
        status = self.request.query_params.get('status')
        if status: qs = qs.filter(status=status)
        return qs

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        app = self.get_object()
        app.status = 'approved'
        app.remarks = request.data.get('remarks', '')
        app.save()
        return Response({'message': f'Application for {app.student_name} approved.'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        app = self.get_object()
        app.status = 'rejected'
        app.remarks = request.data.get('remarks', '')
        app.save()
        return Response({'message': f'Application for {app.student_name} rejected.'})


class HostelAttendanceViewSet(viewsets.ModelViewSet):
    queryset = HostelAttendance.objects.select_related('allotment__room__block').all().order_by('-date')
    serializer_class = HostelAttendanceSerializer
    permission_classes = [IsHostelWarden]
    filter_backends = [filters.SearchFilter]
    search_fields = ['allotment__student_name', 'allotment__student_id']

    def get_queryset(self):
        qs = super().get_queryset()
        date = self.request.query_params.get('date')
        if date: qs = qs.filter(date=date)
        return qs
