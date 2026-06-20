from django.db import models


class Notification(models.Model):
    TYPE = [('info','Info'),('warning','Warning'),('success','Success'),('alert','Alert')]
    TARGET = [('all','All'),('students','Students'),('faculty','Faculty'),('staff','Staff'),('parents','Parents')]
    title      = models.CharField(max_length=200)
    message    = models.TextField()
    notif_type = models.CharField(max_length=20, choices=TYPE, default='info')
    target     = models.CharField(max_length=20, choices=TARGET, default='all')
    is_active  = models.BooleanField(default=True)
    created_by = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
