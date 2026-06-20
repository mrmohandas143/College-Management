import calendar
from decimal import Decimal, ROUND_HALF_UP
from datetime import date, timedelta

from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Employee, Attendance, LeaveRequest, PayrollConfig, Payroll
from .serializers import (
    EmployeeSerializer, AttendanceSerializer, LeaveRequestSerializer,
    PayrollConfigSerializer, PayrollSerializer,
)
from accounts.permissions import IsHR

D = lambda v: Decimal(str(v))
Q = lambda v: D(v).quantize(D('0.01'), rounding=ROUND_HALF_UP)


def _get_config(emp):
    """Return payroll config values for an employee, falling back to defaults."""
    try:
        cfg = emp.payroll_config
        return {
            'hra_pct':      D(cfg.hra_percent),
            'ta_pct':       D(cfg.ta_percent),
            'pf_pct':       D(cfg.pf_percent),
            'tax_pct':      D(cfg.tax_percent),
            'other_allow':  D(cfg.other_allowances),
            'other_deduct': D(cfg.other_deductions),
        }
    except PayrollConfig.DoesNotExist:
        return {
            'hra_pct':      D('20'),
            'ta_pct':       D('10'),
            'pf_pct':       D('12'),
            'tax_pct':      D('10'),
            'other_allow':  D('0'),
            'other_deduct': D('0'),
        }


def _count_attendance(emp, month, year):
    """
    Count present / half-day / holiday days from Attendance records.
    Returns (present, half_day, holiday).
    """
    qs = Attendance.objects.filter(employee=emp, date__month=month, date__year=year)
    return (
        qs.filter(status='present').count(),
        qs.filter(status='half_day').count(),
        qs.filter(status='holiday').count(),
    )


def _count_approved_leaves(emp, month, year):
    """
    Sum approved leave days that fall within the given month.
    Handles leaves that span month boundaries by clamping to month range.
    Unpaid leaves are counted separately (they become absent days).
    """
    month_start = date(year, month, 1)
    month_end   = date(year, month, calendar.monthrange(year, month)[1])

    paid_days   = D('0')
    unpaid_days = D('0')

    leaves = LeaveRequest.objects.filter(
        employee=emp,
        status='approved',
        from_date__lte=month_end,
        to_date__gte=month_start,
    )
    for leave in leaves:
        start = max(leave.from_date, month_start)
        end   = min(leave.to_date,   month_end)
        days  = D((end - start).days + 1)
        if leave.leave_type == 'unpaid':
            unpaid_days += days
        else:
            paid_days += days

    return paid_days, unpaid_days


def calculate_salary(emp, month, year, working_days):
    """
    Core salary engine.

    Attendance logic
    ----------------
    effective_paid = present + (half_day × 0.5) + paid_leave_days + holiday_days
    absent_days    = max(0, working_days − effective_paid − unpaid_leave_days)
    unpaid_days    = unpaid_leave_days  (already absent, no double-count)

    Earnings
    --------
    basic          = employee.basic_salary
    hra            = basic × hra_pct / 100
    ta             = basic × ta_pct  / 100
    gross          = basic + hra + ta + other_allowances

    Deductions
    ----------
    per_day_rate   = basic / working_days
    absent_deduct  = per_day_rate × (absent_days + unpaid_days)
    pf             = basic × pf_pct  / 100
    tax            = gross × tax_pct / 100
    total_deduct   = pf + tax + absent_deduct + other_deductions

    Net
    ---
    net            = max(0, gross − total_deduct)
    """
    cfg = _get_config(emp)

    present, half_day, holiday = _count_attendance(emp, month, year)
    paid_leave, unpaid_leave   = _count_approved_leaves(emp, month, year)

    effective_paid = D(present) + (D(half_day) * D('0.5')) + paid_leave + D(holiday)
    absent_days    = max(D('0'), D(working_days) - effective_paid - unpaid_leave)
    total_absent   = absent_days + unpaid_leave          # days with no pay

    basic         = D(emp.basic_salary)
    per_day_rate  = Q(basic / D(working_days)) if working_days else D('0')

    hra           = Q(basic * cfg['hra_pct']  / D('100'))
    ta            = Q(basic * cfg['ta_pct']   / D('100'))
    gross         = Q(basic + hra + ta + cfg['other_allow'])

    pf            = Q(basic * cfg['pf_pct']   / D('100'))
    tax           = Q(gross * cfg['tax_pct']  / D('100'))
    absent_deduct = Q(per_day_rate * total_absent)
    total_deduct  = Q(pf + tax + absent_deduct + cfg['other_deduct'])

    net           = Q(max(D('0'), gross - total_deduct))

    return {
        # attendance
        'working_days':    working_days,
        'present_days':    present,
        'half_day':        half_day,
        'leave_days':      int(paid_leave),
        'absent_days':     int(total_absent),
        # earnings
        'basic_salary':    basic,
        'hra':             hra,
        'ta':              ta,
        'other_allowances': cfg['other_allow'],
        'gross_salary':    gross,
        # deductions
        'pf_deduction':    pf,
        'tax_deduction':   tax,
        'absent_deduction': absent_deduct,
        'other_deductions': cfg['other_deduct'],
        'total_deductions': total_deduct,
        # net
        'net_salary':      net,
        # meta
        'hra_pct':         cfg['hra_pct'],
        'ta_pct':          cfg['ta_pct'],
        'pf_pct':          cfg['pf_pct'],
        'tax_pct':         cfg['tax_pct'],
    }


# ─── ViewSets ────────────────────────────────────────────────────────────────

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related('department').all().order_by('-created_at')
    serializer_class = EmployeeSerializer
    permission_classes = [IsHR]
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'email', 'employee_id', 'department__name']

    def get_queryset(self):
        qs = super().get_queryset()
        dept       = self.request.query_params.get('department')
        emp_status = self.request.query_params.get('status')
        if dept:       qs = qs.filter(department_id=dept)
        if emp_status: qs = qs.filter(status=emp_status)
        return qs


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('employee').all().order_by('-date')
    serializer_class = AttendanceSerializer
    permission_classes = [IsHR]

    def get_queryset(self):
        qs = super().get_queryset()
        p = self.request.query_params
        if p.get('employee'): qs = qs.filter(employee_id=p['employee'])
        if p.get('month'):    qs = qs.filter(date__month=p['month'])
        if p.get('year'):     qs = qs.filter(date__year=p['year'])
        if p.get('date'):     qs = qs.filter(date=p['date'])
        return qs

    @action(detail=False, methods=['post'])
    def bulk_mark(self, request):
        """Mark attendance for multiple employees on a single date."""
        created = updated = 0
        for rec in request.data.get('records', []):
            _, is_new = Attendance.objects.update_or_create(
                employee_id=rec['employee'],
                date=rec['date'],
                defaults={
                    'status':    rec['status'],
                    'check_in':  rec.get('check_in'),
                    'check_out': rec.get('check_out'),
                    'note':      rec.get('note', ''),
                },
            )
            if is_new: created += 1
            else:      updated += 1
        return Response({'created': created, 'updated': updated})

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Monthly attendance summary per active employee."""
        month = int(request.query_params.get('month', date.today().month))
        year  = int(request.query_params.get('year',  date.today().year))
        result = []
        for emp in Employee.objects.filter(status='active').select_related('department'):
            present, half_day, holiday = _count_attendance(emp, month, year)
            paid_leave, unpaid_leave   = _count_approved_leaves(emp, month, year)
            qs = Attendance.objects.filter(employee=emp, date__month=month, date__year=year)
            result.append({
                'employee_id':   emp.id,
                'employee_name': str(emp),
                'department':    emp.department.name if emp.department else '',
                'present':       present,
                'half_day':      half_day,
                'absent':        qs.filter(status='absent').count(),
                'holiday':       holiday,
                'paid_leave':    int(paid_leave),
                'unpaid_leave':  int(unpaid_leave),
                'total_marked':  qs.count(),
            })
        return Response(result)


class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.select_related('employee').all().order_by('-applied_on')
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsHR]
    filter_backends = [filters.SearchFilter]
    search_fields = ['employee__first_name', 'employee__last_name', 'leave_type', 'status']

    def get_queryset(self):
        qs = super().get_queryset()
        p = self.request.query_params
        if p.get('employee'): qs = qs.filter(employee_id=p['employee'])
        if p.get('status'):   qs = qs.filter(status=p['status'])
        return qs


class PayrollConfigViewSet(viewsets.ModelViewSet):
    queryset = PayrollConfig.objects.select_related('employee').all()
    serializer_class = PayrollConfigSerializer
    permission_classes = [IsHR]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get('employee'):
            qs = qs.filter(employee_id=self.request.query_params['employee'])
        return qs


class PayrollViewSet(viewsets.ModelViewSet):
    queryset = Payroll.objects.select_related('employee', 'employee__department').all().order_by('-year', '-month')
    serializer_class = PayrollSerializer
    permission_classes = [IsHR]

    def get_queryset(self):
        qs = super().get_queryset()
        p = self.request.query_params
        if p.get('employee'): qs = qs.filter(employee_id=p['employee'])
        if p.get('month'):    qs = qs.filter(month=p['month'])
        if p.get('year'):     qs = qs.filter(year=p['year'])
        if p.get('status'):   qs = qs.filter(status=p['status'])
        return qs

    @action(detail=False, methods=['post'])
    def process(self, request):
        """
        Run payroll for all active employees for a given month/year.
        Uses calculate_salary() for every employee and persists results.
        """
        month        = int(request.data.get('month'))
        year         = int(request.data.get('year'))
        working_days = int(request.data.get('working_days', 26))

        results = []
        for emp in Employee.objects.filter(status='active').select_related('department', 'payroll_config'):
            data = calculate_salary(emp, month, year, working_days)
            payroll, _ = Payroll.objects.update_or_create(
                employee=emp, month=month, year=year,
                defaults={**{k: v for k, v in data.items() if not k.endswith('_pct')}, 'status': 'processed'},
            )
            results.append(PayrollSerializer(payroll).data)

        return Response({'processed': len(results), 'payrolls': results})

    @action(detail=False, methods=['post'])
    def preview(self, request):
        """
        Preview salary breakdown for a single employee without saving.
        Used by the frontend salary calculator.
        """
        emp_id       = request.data.get('employee')
        month        = int(request.data.get('month'))
        year         = int(request.data.get('year'))
        working_days = int(request.data.get('working_days', 26))

        try:
            emp = Employee.objects.select_related('department', 'payroll_config').get(pk=emp_id)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=404)

        data = calculate_salary(emp, month, year, working_days)
        data['employee_name'] = str(emp)
        data['department']    = emp.department.name if emp.department else ''
        return Response(data)

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        payroll = self.get_object()
        payroll.status  = 'paid'
        payroll.paid_on = request.data.get('paid_on', date.today().isoformat())
        payroll.save()
        return Response(PayrollSerializer(payroll).data)

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        month = int(request.query_params.get('month', date.today().month))
        year  = int(request.query_params.get('year',  date.today().year))

        payrolls = Payroll.objects.filter(month=month, year=year).select_related('employee__department')

        total_gross      = sum(D(p.gross_salary)      for p in payrolls) or D('0')
        total_net        = sum(D(p.net_salary)         for p in payrolls) or D('0')
        total_deductions = sum(D(p.total_deductions)   for p in payrolls) or D('0')
        total_pf         = sum(D(p.pf_deduction)       for p in payrolls) or D('0')
        total_tax        = sum(D(p.tax_deduction)       for p in payrolls) or D('0')

        by_dept = {}
        for p in payrolls:
            dept = p.employee.department.name if p.employee.department else 'Unassigned'
            by_dept.setdefault(dept, {'gross': D('0'), 'net': D('0'), 'count': 0})
            by_dept[dept]['gross'] += D(p.gross_salary)
            by_dept[dept]['net']   += D(p.net_salary)
            by_dept[dept]['count'] += 1

        leave_stats = {
            lt: LeaveRequest.objects.filter(
                status='approved',
                from_date__month=month, from_date__year=year,
                leave_type=lt,
            ).count()
            for lt in ['sick', 'casual', 'earned', 'unpaid']
        }

        # month-over-month trend (last 6 months)
        trend = []
        for i in range(5, -1, -1):
            m = month - i
            y = year
            while m <= 0:
                m += 12; y -= 1
            ps = Payroll.objects.filter(month=m, year=y)
            trend.append({
                'label': f"{calendar.month_abbr[m]} {y}",
                'net':   float(sum(D(p.net_salary) for p in ps) or 0),
                'count': ps.count(),
            })

        return Response({
            'month': month, 'year': year,
            'employee_total':  Employee.objects.count(),
            'employee_active': Employee.objects.filter(status='active').count(),
            'payroll_count':   payrolls.count(),
            'paid_count':      payrolls.filter(status='paid').count(),
            'pending_count':   payrolls.filter(status='processed').count(),
            'total_gross':      float(total_gross),
            'total_net':        float(total_net),
            'total_deductions': float(total_deductions),
            'total_pf':         float(total_pf),
            'total_tax':        float(total_tax),
            'by_department': [
                {'department': k, 'gross': float(v['gross']), 'net': float(v['net']), 'count': v['count']}
                for k, v in by_dept.items()
            ],
            'leave_stats': leave_stats,
            'trend': trend,
        })
