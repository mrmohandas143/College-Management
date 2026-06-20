from rest_framework.permissions import BasePermission, SAFE_METHODS

ADMIN_ROLES   = ('super_admin', 'admin')
HR_ROLES      = ('super_admin', 'admin', 'hr')
FINANCE_ROLES = ('super_admin', 'admin', 'accountant')
STAFF_ROLES   = ('super_admin', 'admin', 'hr', 'accountant', 'faculty',
                 'librarian', 'hostel_warden', 'placement_officer',
                 'transport_incharge', 'alumni_coordinator')


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'super_admin'


class IsAdmin(BasePermission):
    """Admin or Super Admin."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ADMIN_ROLES


class IsHR(BasePermission):
    """HR, Admin, or Super Admin."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in HR_ROLES


class IsAccountant(BasePermission):
    """Accountant, Admin, or Super Admin."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in FINANCE_ROLES


class IsLibrarian(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('super_admin', 'admin', 'librarian')


class IsHostelWarden(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('super_admin', 'admin', 'hostel_warden')


class IsPlacementOfficer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('super_admin', 'admin', 'placement_officer')


class IsTransportIncharge(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('super_admin', 'admin', 'transport_incharge')


class IsAlumniCoordinator(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('super_admin', 'admin', 'alumni_coordinator')


class IsAdminOrFaculty(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('super_admin', 'admin', 'faculty')


class IsAdminOrFacultyReadOnly(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role in ADMIN_ROLES:
            return True
        if request.user.role == 'faculty':
            return request.method in SAFE_METHODS
        return False


class IsAnyAuthenticated(BasePermission):
    """All authenticated staff/admin can read. Only admin/faculty can write."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in (*ADMIN_ROLES, 'faculty')


class IsAuthenticatedStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated


class IsParent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'parent'


class IsParentOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (*ADMIN_ROLES, 'parent')
