from rest_framework import serializers
from .models import BookCategory, Book, BookIssue

class BookCategorySerializer(serializers.ModelSerializer):
    class Meta: model = BookCategory; fields = '__all__'

class BookSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    class Meta: model = Book; fields = '__all__'

class BookIssueSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    class Meta: model = BookIssue; fields = '__all__'
