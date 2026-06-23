from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/students/', include('students.urls')),
    path('api/faculty/', include('faculty.urls')),
    path('api/fees/', include('fees.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/hr/', include('hr.urls')),
    path('api/library/', include('library.urls')),
    path('api/hostel/', include('hostel.urls')),
    path('api/placement/', include('placement.urls')),
    path('api/transport/', include('transport.urls')),
    path('api/alumni/', include('alumni.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/academics/', include('academics.urls')),
    path('api/timetable/', include('timetable.urls')),
    path('api/examination/', include('examination.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/departments/', include('departments.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
