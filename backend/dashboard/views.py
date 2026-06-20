from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from students.models import Student
from faculty.models import Faculty
from fees.models import Fee


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    role = request.user.role
    data = {}

    # Student & faculty counts — visible to admin roles + faculty + hr
    if role in ('super_admin', 'admin', 'faculty', 'hr'):
        data['students'] = {
            'total':  Student.objects.count(),
            'active': Student.objects.filter(status='active').count(),
        }
        data['faculty'] = {
            'total':  Faculty.objects.count(),
            'active': Faculty.objects.filter(status='active').count(),
        }

    # Fee data — admin + accountant
    if role in ('super_admin', 'admin', 'accountant'):
        paid_fees    = Fee.objects.filter(status='paid')
        pending_fees = Fee.objects.filter(status__in=['pending', 'overdue'])
        data['fees'] = {
            'total':           Fee.objects.count(),
            'paid':            paid_fees.count(),
            'pending':         Fee.objects.filter(status='pending').count(),
            'overdue':         Fee.objects.filter(status='overdue').count(),
            'total_revenue':   float(sum(f.amount for f in paid_fees)),
            'pending_revenue': float(sum(f.amount for f in pending_fees)),
        }

    return Response(data)
