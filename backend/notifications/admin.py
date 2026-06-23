from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'notif_type', 'target', 'is_active', 'created_by', 'created_at', 'expires_at')
    list_filter = ('notif_type', 'target', 'is_active', 'created_at')
    search_fields = ('title', 'message', 'created_by')
