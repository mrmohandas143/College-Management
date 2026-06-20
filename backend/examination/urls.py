from rest_framework.routers import DefaultRouter
from .views import ExamViewSet, ExamResultViewSet
router = DefaultRouter()
router.register('exams', ExamViewSet)
router.register('results', ExamResultViewSet)
urlpatterns = router.urls
