from django.urls import path
from .views import overview_report, fee_report, attendance_report, exam_report, payroll_report

urlpatterns = [
    path('overview/',   overview_report),
    path('fees/',       fee_report),
    path('attendance/', attendance_report),
    path('exams/',      exam_report),
    path('payroll/',    payroll_report),
]
