from rest_framework import generics, filters
from .models import Department
from .serializers import DepartmentSerializer
from accounts.permissions import IsAdmin, IsAnyAuthenticated


class DepartmentListCreateView(generics.ListCreateAPIView):
    queryset = Department.objects.all().order_by('name')
    serializer_class = DepartmentSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'code', 'head']

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAnyAuthenticated()]
        return [IsAdmin()]


class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAnyAuthenticated()]
        return [IsAdmin()]
