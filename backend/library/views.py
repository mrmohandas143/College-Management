from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import BookCategory, Book, BookIssue
from .serializers import BookCategorySerializer, BookSerializer, BookIssueSerializer
from accounts.permissions import IsLibrarian


class BookCategoryViewSet(viewsets.ModelViewSet):
    queryset = BookCategory.objects.all().order_by('name')
    serializer_class = BookCategorySerializer
    permission_classes = [IsLibrarian]


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.select_related('category').all().order_by('-added_on')
    serializer_class = BookSerializer
    permission_classes = [IsLibrarian]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'author', 'isbn', 'category__name']

    def get_queryset(self):
        qs = super().get_queryset()
        status = self.request.query_params.get('status')
        category = self.request.query_params.get('category')
        if status:   qs = qs.filter(status=status)
        if category: qs = qs.filter(category_id=category)
        return qs

    @action(detail=False, methods=['get'])
    def stats(self, request):
        return Response({
            'total_books':     Book.objects.count(),
            'available':       Book.objects.filter(status='available').count(),
            'issued':          Book.objects.filter(status='issued').count(),
            'total_issues':    BookIssue.objects.count(),
            'active_issues':   BookIssue.objects.filter(status='issued').count(),
            'overdue':         BookIssue.objects.filter(status='overdue').count(),
        })


class BookIssueViewSet(viewsets.ModelViewSet):
    queryset = BookIssue.objects.select_related('book').all().order_by('-issue_date')
    serializer_class = BookIssueSerializer
    permission_classes = [IsLibrarian]
    filter_backends = [filters.SearchFilter]
    search_fields = ['book__title', 'member_name', 'member_id', 'status']

    def get_queryset(self):
        qs = super().get_queryset()
        status = self.request.query_params.get('status')
        if status: qs = qs.filter(status=status)
        return qs

    def perform_create(self, serializer):
        issue = serializer.save()
        book = issue.book
        if book.available_copies > 0:
            book.available_copies -= 1
            if book.available_copies == 0:
                book.status = 'issued'
            book.save()

    @action(detail=True, methods=['post'])
    def return_book(self, request, pk=None):
        from datetime import date
        from decimal import Decimal
        issue = self.get_object()
        issue.return_date = date.today()
        issue.status = 'returned'
        if issue.return_date > issue.due_date:
            overdue_days = (issue.return_date - issue.due_date).days
            issue.fine_amount = Decimal(overdue_days) * Decimal('5.00')
        issue.save()
        book = issue.book
        book.available_copies += 1
        book.status = 'available'
        book.save()
        return Response(BookIssueSerializer(issue).data)
