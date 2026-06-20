from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Route, Vehicle, TransportAllotment
from .serializers import RouteSerializer, VehicleSerializer, TransportAllotmentSerializer
from accounts.permissions import IsTransportIncharge


class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.all().order_by('name')
    serializer_class = RouteSerializer
    permission_classes = [IsTransportIncharge]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'start_point', 'end_point']

    @action(detail=False, methods=['get'])
    def stats(self, request):
        return Response({
            'total_routes':    Route.objects.count(),
            'total_vehicles':  Vehicle.objects.count(),
            'active_vehicles': Vehicle.objects.filter(status='active').count(),
            'total_allotments': TransportAllotment.objects.filter(is_active=True).count(),
        })


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.select_related('route').all().order_by('reg_number')
    serializer_class = VehicleSerializer
    permission_classes = [IsTransportIncharge]
    filter_backends = [filters.SearchFilter]
    search_fields = ['reg_number', 'driver_name', 'status']

    def get_queryset(self):
        qs = super().get_queryset()
        status = self.request.query_params.get('status')
        route  = self.request.query_params.get('route')
        if status: qs = qs.filter(status=status)
        if route:  qs = qs.filter(route_id=route)
        return qs


class TransportAllotmentViewSet(viewsets.ModelViewSet):
    queryset = TransportAllotment.objects.select_related('route', 'vehicle').all().order_by('-valid_from')
    serializer_class = TransportAllotmentSerializer
    permission_classes = [IsTransportIncharge]
    filter_backends = [filters.SearchFilter]
    search_fields = ['student_name', 'student_id', 'route__name']
