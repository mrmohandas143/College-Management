from rest_framework import generics, filters
from rest_framework.exceptions import PermissionDenied
from .models import Student
from .serializers import StudentSerializer
from accounts.permissions import IsAdmin, IsAnyAuthenticated


class StudentListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'email', 'register_number', 'course']

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAnyAuthenticated()]
        return [IsAdmin()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Student.objects.filter(id=user.student_id) if user.student_id else Student.objects.none()
        return Student.objects.all().order_by('-created_at')


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAnyAuthenticated()]
        return [IsAdmin()]

    def get_queryset(self):
        return Student.objects.all()

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        if user.role == 'student' and user.student_id != obj.id:
            raise PermissionDenied('You can only view your own profile.')
        return obj
