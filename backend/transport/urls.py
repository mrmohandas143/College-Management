from rest_framework.routers import DefaultRouter
from .views import RouteViewSet, VehicleViewSet, TransportAllotmentViewSet
router = DefaultRouter()
router.register('routes', RouteViewSet)
router.register('vehicles', VehicleViewSet)
router.register('allotments', TransportAllotmentViewSet)
urlpatterns = router.urls
