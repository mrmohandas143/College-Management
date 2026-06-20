from rest_framework.routers import DefaultRouter
from .views import AlumniProfileViewSet, AlumniEventViewSet, AlumniEventRegistrationViewSet
router = DefaultRouter()
router.register('profiles', AlumniProfileViewSet)
router.register('events', AlumniEventViewSet)
router.register('registrations', AlumniEventRegistrationViewSet)
urlpatterns = router.urls
