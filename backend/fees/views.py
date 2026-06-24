import uuid
from rest_framework import generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from .models import Fee, FeeStructure
from .serializers import FeeSerializer, FeeStructureSerializer
from accounts.permissions import IsAdmin, IsAccountant, IsAnyAuthenticated


class FeeListCreateView(generics.ListCreateAPIView):
    serializer_class = FeeSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['student__first_name', 'student__last_name', 'fee_type', 'status', 'receipt_number']

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAnyAuthenticated()]
        if self.request.method == 'POST':
            from rest_framework.permissions import IsAuthenticated
            return [IsAuthenticated()]
        return [IsAccountant()]

    def get_queryset(self):
        user = self.request.user
        qs = Fee.objects.select_related('student').order_by('-created_at')
        if user.role == 'student':
            return qs.filter(student_id=user.linked_student_id)
        if user.role == 'parent':
            return qs.filter(student_id=user.linked_student_id)
        status_filter = self.request.query_params.get('status')
        fee_type      = self.request.query_params.get('fee_type')
        semester      = self.request.query_params.get('semester')
        student_id    = self.request.query_params.get('student')
        if status_filter: qs = qs.filter(status=status_filter)
        if fee_type:      qs = qs.filter(fee_type=fee_type)
        if semester:      qs = qs.filter(semester=semester)
        if student_id:    qs = qs.filter(student_id=student_id)
        return qs


class FeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FeeSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAnyAuthenticated()]
        return [IsAccountant()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Fee.objects.filter(student_id=user.linked_student_id)
        if user.role == 'parent':
            return Fee.objects.filter(student_id=user.linked_student_id)
        return Fee.objects.all()


class FeeStructureListCreateView(generics.ListCreateAPIView):
    queryset = FeeStructure.objects.all().order_by('-created_at')
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAnyAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'course', 'department', 'fee_type']


class FeeStructureDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = FeeStructure.objects.all()
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAccountant]


class StudentFeeView(APIView):
    permission_classes = [IsAnyAuthenticated]

    def get(self, request, student_id):
        fees = Fee.objects.filter(student_id=student_id).select_related('student').order_by('-created_at')
        return Response(FeeSerializer(fees, many=True).data)


class ProcessPaymentView(APIView):
    permission_classes = [IsAnyAuthenticated]

    @transaction.atomic
    def post(self, request):
        fee_id        = request.data.get('fee_id')
        payment_mode  = request.data.get('payment_mode', 'Online')
        transaction_id = request.data.get('transaction_id', f"TXN-{uuid.uuid4().hex[:10].upper()}")
        try:
            fee = Fee.objects.get(id=fee_id)
            if request.user.role == 'student' and fee.student_id != request.user.linked_student_id:
                return Response({'error': 'Unauthorized'}, status=403)
            if fee.status == 'paid':
                return Response({'error': 'Fee is already paid'}, status=400)
            fee.status         = 'paid'
            fee.paid_date      = timezone.now().date()
            fee.payment_mode   = payment_mode
            fee.transaction_id = transaction_id
            fee.save()
            return Response({'message': 'Payment processed successfully', 'receipt_number': fee.receipt_number})
        except Fee.DoesNotExist:
            return Response({'error': 'Fee not found'}, status=404)


class GenerateBulkFeesView(APIView):
    permission_classes = [IsAccountant]

    def post(self, request):
        structure_id = request.data.get('structure_id')
        student_ids  = request.data.get('student_ids', [])
        due_date     = request.data.get('due_date')
        if not all([structure_id, student_ids, due_date]):
            return Response({'error': 'structure_id, student_ids, and due_date are required'}, status=400)
        try:
            structure = FeeStructure.objects.get(id=structure_id)
            
            final_student_ids = student_ids
            if structure.fee_type == 'transport':
                from hostel.models import HostelAllotment
                target_students = Student.objects.filter(id__in=student_ids)
                target_student_mapping = {s.id: (s.roll_number, s.register_number) for s in target_students}
                
                hosteler_student_ids = set()
                for s_id, (roll, reg) in target_student_mapping.items():
                    if HostelAllotment.objects.filter(
                        student_id__in=[roll, reg],
                        status='active'
                    ).exists():
                        hosteler_student_ids.add(s_id)
                final_student_ids = [s_id for s_id in student_ids if s_id not in hosteler_student_ids]

            Fee.objects.bulk_create([
                Fee(
                    student_id=s_id, fee_structure=structure,
                    amount=structure.amount, fee_type=structure.fee_type,
                    semester=structure.semester, academic_year=structure.academic_year,
                    due_date=due_date,
                ) for s_id in final_student_ids
            ])
            return Response({'message': f'Generated {len(final_student_ids)} fee records.'})
        except FeeStructure.DoesNotExist:
            return Response({'error': 'Fee structure not found'}, status=404)


from django.db.models import Sum
from students.models import Student
from students.serializers import StudentSerializer
from notifications.models import Notification
from accounts.permissions import IsParent

class ParentPortalView(APIView):
    permission_classes = [IsParent]

    def get(self, request):
        student = request.user.linked_student
        if not student:
            return Response({
                'no_link': True,
                'message': 'No student linked to this parent account.'
            }, status=200)

        student_data = StudentSerializer(student).data
        
        fees = Fee.objects.filter(student=student).order_by('-created_at')
        fees_data = FeeSerializer(fees, many=True).data

        total_fees = fees.aggregate(total=Sum('amount'))['total'] or 0
        paid_fees = fees.filter(status='paid').aggregate(total=Sum('amount'))['total'] or 0
        pending_fees = fees.filter(status='pending').aggregate(total=Sum('amount'))['total'] or 0
        overdue_fees = fees.filter(status='overdue').aggregate(total=Sum('amount'))['total'] or 0

        summary = {
            'total': total_fees,
            'paid': paid_fees,
            'pending': pending_fees + overdue_fees
        }

        notifs = Notification.objects.filter(target__in=['parents', 'all'], is_active=True).order_by('-created_at')
        notifs_data = []
        for n in notifs:
            notifs_data.append({
                'id': n.id,
                'title': n.title,
                'message': n.message,
                'notification_type': 'general' if n.notif_type == 'info' else
                                     'due_reminder' if n.notif_type == 'warning' else
                                     'overdue' if n.notif_type == 'alert' else
                                     'payment_confirm' if n.notif_type == 'success' else 'general',
                'created_at': n.created_at,
                'is_read': False
            })

        return Response({
            'student': student_data,
            'fees': fees_data,
            'notifications': notifs_data,
            'summary': summary
        })

    def post(self, request):
        student_id = request.data.get('student_id')
        if not student_id:
            return Response({'error': 'student_id is required.'}, status=400)

        try:
            student = Student.objects.get(id=student_id)
            request.user.linked_student = student
            request.user.save()
            return Response({
                'success': True,
                'message': f'Successfully linked to student {student.first_name} {student.last_name}'
            })
        except Student.DoesNotExist:
            return Response({'error': 'Student not found.'}, status=404)
