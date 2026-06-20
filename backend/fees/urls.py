from django.urls import path
from .views import (
    FeeListCreateView, FeeDetailView,
    FeeStructureListCreateView, FeeStructureDetailView,
    StudentFeeView, ProcessPaymentView, GenerateBulkFeesView,
)

urlpatterns = [
    path('', FeeListCreateView.as_view()),
    path('<int:pk>/', FeeDetailView.as_view()),
    path('structures/', FeeStructureListCreateView.as_view()),
    path('structures/<int:pk>/', FeeStructureDetailView.as_view()),
    path('student/<int:student_id>/', StudentFeeView.as_view()),
    path('process-payment/', ProcessPaymentView.as_view()),
    path('generate-bulk/', GenerateBulkFeesView.as_view()),
]
