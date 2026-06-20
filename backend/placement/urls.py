from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, PlacementDriveViewSet, PlacementApplicationViewSet
router = DefaultRouter()
router.register('companies', CompanyViewSet)
router.register('drives', PlacementDriveViewSet)
router.register('applications', PlacementApplicationViewSet)
urlpatterns = router.urls
