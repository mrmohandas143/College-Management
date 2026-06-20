from rest_framework.routers import DefaultRouter
from .views import AttendanceSessionViewSet, StudentAttendanceViewSet
router = DefaultRouter()
router.register('sessions', AttendanceSessionViewSet)
router.register('records', StudentAttendanceViewSet)
urlpatterns = router.urls
