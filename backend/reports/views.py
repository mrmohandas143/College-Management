from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdmin
from students.models import Student
from faculty.models import Faculty
from fees.models import Fee
from hr.models import Employee, Payroll
from attendance.models import StudentAttendance
from examination.models import Exam, ExamResult
from hostel.models import HostelAllotment
from placement.models import PlacementApplication
from library.models import BookIssue


@api_view(['GET'])
@permission_classes([IsAdmin])
def overview_report(request):
    return Response({
        'students':    {'total': Student.objects.count(), 'active': Student.objects.filter(status='active').count()},
        'faculty':     {'total': Faculty.objects.count(), 'active': Faculty.objects.filter(status='active').count()},
        'employees':   {'total': Employee.objects.count(), 'active': Employee.objects.filter(status='active').count()},
        'fees':        {
            'total':   Fee.objects.count(),
            'paid':    Fee.objects.filter(status='paid').count(),
            'pending': Fee.objects.filter(status='pending').count(),
            'overdue': Fee.objects.filter(status='overdue').count(),
        },
        'exams':       {'total': Exam.objects.count(), 'completed': Exam.objects.filter(status='completed').count()},
        'hostel':      {'allotments': HostelAllotment.objects.filter(status='active').count()},
        'placement':   {'selected': PlacementApplication.objects.filter(status='selected').count()},
        'library':     {'active_issues': BookIssue.objects.filter(status='issued').count()},
    })


@api_view(['GET'])
@permission_classes([IsAdmin])
def fee_report(request):
    from django.db.models import Sum
    fees = Fee.objects.all()
    paid    = fees.filter(status='paid')
    pending = fees.filter(status='pending')
    overdue = fees.filter(status='overdue')
    return Response({
        'total_records': fees.count(),
        'paid_count':    paid.count(),
        'pending_count': pending.count(),
        'overdue_count': overdue.count(),
        'total_collected': float(paid.aggregate(s=Sum('amount'))['s'] or 0),
        'total_pending':   float(pending.aggregate(s=Sum('amount'))['s'] or 0),
        'total_overdue':   float(overdue.aggregate(s=Sum('amount'))['s'] or 0),
    })


@api_view(['GET'])
@permission_classes([IsAdmin])
def attendance_report(request):
    total   = StudentAttendance.objects.count()
    present = StudentAttendance.objects.filter(status='present').count()
    absent  = StudentAttendance.objects.filter(status='absent').count()
    late    = StudentAttendance.objects.filter(status='late').count()
    return Response({
        'total': total,
        'present': present,
        'absent': absent,
        'late': late,
        'attendance_rate': round((present / total) * 100, 1) if total else 0,
    })


@api_view(['GET'])
@permission_classes([IsAdmin])
def exam_report(request):
    results = ExamResult.objects.all()
    total   = results.count()
    passed  = results.filter(is_pass=True).count()
    grade_dist = {}
    for g in ['O', 'A+', 'A', 'B+', 'B', 'C', 'F']:
        grade_dist[g] = results.filter(grade=g).count()
    return Response({
        'total_results': total,
        'pass_count':    passed,
        'fail_count':    total - passed,
        'pass_rate':     round((passed / total) * 100, 1) if total else 0,
        'grade_distribution': grade_dist,
    })


@api_view(['GET'])
@permission_classes([IsAdmin])
def payroll_report(request):
    from decimal import Decimal
    payrolls = Payroll.objects.all()
    return Response({
        'total_payrolls': payrolls.count(),
        'paid':           payrolls.filter(status='paid').count(),
        'pending':        payrolls.filter(status='processed').count(),
        'total_gross':    float(sum(p.gross_salary for p in payrolls) or 0),
        'total_net':      float(sum(p.net_salary for p in payrolls) or 0),
        'total_deductions': float(sum(p.total_deductions for p in payrolls) or 0),
    })
