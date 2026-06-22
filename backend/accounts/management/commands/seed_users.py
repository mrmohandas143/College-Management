from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

USERS = [
    # (username,          password,          role,                 email,                              is_staff, is_superuser)
    ('superadmin',        'SuperAdmin@123',   'super_admin',        'superadmin@collegems.com',         True,     True),
    ('admin',             'Admin@123',        'admin',              'admin@collegems.com',              True,     False),
    ('hr_manager',        'HR@123',           'hr',                 'hr@collegems.com',                 False,    False),
    ('accountant',        'Accounts@123',     'accountant',         'accounts@collegems.com',           False,    False),
    ('librarian',         'Library@123',      'librarian',          'library@collegems.com',            False,    False),
    ('hostel_warden',     'Hostel@123',       'hostel_warden',      'hostel@collegems.com',             False,    False),
    ('placement_officer', 'Placement@123',    'placement_officer',  'placement@collegems.com',          False,    False),
    ('transport',         'Transport@123',    'transport_incharge', 'transport@collegems.com',          False,    False),
    ('alumni_coord',      'Alumni@123',       'alumni_coordinator', 'alumni@collegems.com',             False,    False),
]


class Command(BaseCommand):
    help = 'Wipe all existing users and create fresh role-based accounts'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Deleting all existing users...'))
        User.objects.exclude(username='Das').delete()

        self.stdout.write(self.style.SUCCESS('Creating fresh users:\n'))
        for username, password, role, email, is_staff, is_superuser in USERS:
            user = User.objects.create_user(
                username=username,
                password=password,
                email=email,
                role=role,
                is_staff=is_staff,
                is_superuser=is_superuser,
            )
            self.stdout.write(
                f'  OK  {username:<22} role={role:<22} password={password}'
            )

        self.stdout.write(self.style.SUCCESS('\nDone. All users created successfully.'))
