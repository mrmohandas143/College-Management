from django.urls import path
from .views import FacultyListCreateView, FacultyDetailView

urlpatterns = [
    path('', FacultyListCreateView.as_view()),
    path('<int:pk>/', FacultyDetailView.as_view()),
]
