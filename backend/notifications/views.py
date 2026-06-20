from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer
from accounts.permissions import IsAdmin


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().order_by('-created_at')
    serializer_class = NotificationSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'message', 'target']

    def get_permissions(self):
        if self.request.method in ('GET',):
            return [IsAuthenticated()]
        return [IsAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        target = self.request.query_params.get('target')
        active = self.request.query_params.get('active')
        if target: qs = qs.filter(target__in=[target, 'all'])
        if active: qs = qs.filter(is_active=active == 'true')
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user.username)
