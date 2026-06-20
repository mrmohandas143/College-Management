from rest_framework import serializers
from .models import Faculty
from accounts.models import User

ROLE_LABELS = {
    'faculty':            'Faculty',
    'hr':                 'HR',
    'accountant':         'Accountant',
    'librarian':          'Librarian',
    'hostel_warden':      'Hostel Warden',
    'placement_officer':  'Placement Officer',
    'transport_incharge': 'Transport Incharge',
    'alumni_coordinator': 'Alumni Coordinator',
}


class FacultySerializer(serializers.ModelSerializer):
    assigned_role       = serializers.SerializerMethodField()
    assigned_role_label = serializers.SerializerMethodField()

    class Meta:
        model  = Faculty
        fields = '__all__'

    def _get_user(self, obj):
        return User.objects.filter(email=obj.email).first()

    def get_assigned_role(self, obj):
        user = self._get_user(obj)
        if user and user.role not in ('student', 'parent', 'super_admin', 'admin'):
            return user.role
        return None

    def get_assigned_role_label(self, obj):
        user = self._get_user(obj)
        if user and user.role not in ('student', 'parent', 'super_admin', 'admin'):
            return ROLE_LABELS.get(user.role, user.role)
        return None
