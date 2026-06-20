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
        return [IsAccountant()]

    def get_queryset(self):
        user = self.request.user
        qs = Fee.objects.select_related('student').order_by('-created_at')
        if user.role == 'student':
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
            Fee.objects.bulk_create([
                Fee(
                    student_id=s_id, fee_structure=structure,
                    amount=structure.amount, fee_type=structure.fee_type,
                    semester=structure.semester, academic_year=structure.academic_year,
                    due_date=due_date,
                ) for s_id in student_ids
            ])
            return Response({'message': f'Generated {len(student_ids)} fee records.'})
        except FeeStructure.DoesNotExist:
            return Response({'error': 'Fee structure not found'}, status=404)
