from rest_framework.routers import DefaultRouter
from .views import SubjectViewSet, AcademicCalendarViewSet
router = DefaultRouter()
router.register('subjects', SubjectViewSet)
router.register('calendar', AcademicCalendarViewSet)
urlpatterns = router.urls
