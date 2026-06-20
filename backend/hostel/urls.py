from rest_framework.routers import DefaultRouter
from .views import (HostelBlockViewSet, RoomViewSet, HostelAllotmentViewSet,
                    HostelFeeViewSet, VisitorViewSet, LeaveRequestViewSet,
                    HostelComplaintViewSet, HostelApplicationViewSet, HostelAttendanceViewSet)

router = DefaultRouter()
router.register('blocks',       HostelBlockViewSet)
router.register('rooms',        RoomViewSet)
router.register('allotments',   HostelAllotmentViewSet)
router.register('fees',         HostelFeeViewSet)
router.register('visitors',     VisitorViewSet)
router.register('leaves',       LeaveRequestViewSet)
router.register('complaints',   HostelComplaintViewSet)
router.register('applications', HostelApplicationViewSet)
router.register('attendance',   HostelAttendanceViewSet)
urlpatterns = router.urls
