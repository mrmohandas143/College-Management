from rest_framework.routers import DefaultRouter
from .views import EmployeeViewSet, AttendanceViewSet, LeaveRequestViewSet, PayrollConfigViewSet, PayrollViewSet

router = DefaultRouter()
router.register('employees', EmployeeViewSet)
router.register('attendance', AttendanceViewSet)
router.register('leaves', LeaveRequestViewSet)
router.register('payroll-config', PayrollConfigViewSet)
router.register('payroll', PayrollViewSet)

urlpatterns = router.urls
