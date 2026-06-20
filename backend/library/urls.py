from rest_framework.routers import DefaultRouter
from .views import BookCategoryViewSet, BookViewSet, BookIssueViewSet
router = DefaultRouter()
router.register('categories', BookCategoryViewSet)
router.register('books', BookViewSet)
router.register('issues', BookIssueViewSet)
urlpatterns = router.urls
