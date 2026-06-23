# pyrefly: ignore [missing-import]
from django.contrib import admin
# pyrefly: ignore [missing-import]
from django.contrib.auth.admin import UserAdmin
from .models import User, CustomRole

@admin.register(CustomRole)
class CustomRoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Extra Info', {'fields': ('role', 'custom_role', 'linked_student', 'custom_permissions', 'full_name', 'phone', 'department')}),
    )
    list_display = ['username', 'email', 'role', 'full_name', 'is_staff']
    search_fields = ('username', 'email', 'full_name')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
