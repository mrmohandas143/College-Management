from django.contrib import admin
from .models import BookCategory, Book, BookIssue

@admin.register(BookCategory)
class BookCategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'isbn', 'category', 'total_copies', 'available_copies', 'rack_number', 'status')
    list_filter = ('category', 'status')
    search_fields = ('title', 'author', 'isbn')

@admin.register(BookIssue)
class BookIssueAdmin(admin.ModelAdmin):
    list_display = ('book', 'member_name', 'member_type', 'member_id', 'issue_date', 'due_date', 'return_date', 'fine_amount', 'status')
    list_filter = ('member_type', 'status', 'issue_date')
    search_fields = ('member_name', 'member_id', 'book__title')
