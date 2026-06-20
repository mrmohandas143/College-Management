from rest_framework import generics, filters
from .models import Faculty
from .serializers import FacultySerializer
from accounts.permissions import IsAdminOrFacultyReadOnly, IsAdmin


class FacultyListCreateView(generics.ListCreateAPIView):
    queryset = Faculty.objects.all().order_by('-created_at')
    serializer_class = FacultySerializer
    permission_classes = [IsAdminOrFacultyReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'email', 'department', 'designation']


class FacultyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    permission_classes = [IsAdminOrFacultyReadOnly]
