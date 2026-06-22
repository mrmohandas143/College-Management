from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from accounts.permissions import IsAdmin
from students.models import Student
from .models import User, CustomRole
from .serializers import RegisterSerializer, CustomTokenObtainPairSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['POST'])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── User Management ──────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdmin])
def list_users(request):
    """List all system users."""
    users = User.objects.all().order_by('role', 'username')
    data = [
        {
            'id':                 u.id,
            'username':           u.username,
            'email':              u.email,
            'full_name':          u.full_name,
            'phone':              u.phone,
            'department':         u.department,
            'role':               u.role,
            'is_active':          u.is_active,
            'custom_permissions': u.custom_permissions,
            'last_login':         u.last_login.isoformat() if u.last_login else None,
            'date_joined':        u.date_joined.isoformat() if u.date_joined else None,
        }
        for u in users
    ]
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAdmin])
def create_system_user(request):
    """Create a new system user with role, password and optional permissions."""
    username    = request.data.get('username', '').strip()
    email       = request.data.get('email', '').strip()
    role        = request.data.get('role', '')
    password    = request.data.get('password', '')
    full_name   = request.data.get('full_name', '')
    phone       = request.data.get('phone', '')
    department  = request.data.get('department', '')
    permissions = request.data.get('custom_permissions', [])
    custom_role_id = request.data.get('custom_role_id')

    if not all([username, role, password]):
        return Response({'error': 'username, role and password are required.'}, status=400)

    allowed = [r[0] for r in User.ROLE_CHOICES]
    if role not in allowed:
        return Response({'error': f'Invalid role.'}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'error': f'Username "{username}" already exists.'}, status=400)

    try:
        validate_password(password)
    except ValidationError as e:
        return Response({'error': list(e.messages)}, status=400)

    custom_role_obj = None
    if custom_role_id:
        try:
            custom_role_obj = CustomRole.objects.get(id=custom_role_id)
        except CustomRole.DoesNotExist:
            return Response({'error': 'Custom role not found.'}, status=404)

    user = User.objects.create_user(
        username=username, email=email, password=password, role=role,
        full_name=full_name, phone=phone, department=department,
        custom_permissions=permissions,
        custom_role=custom_role_obj,
        is_staff=(role in ('super_admin', 'admin')),
        is_superuser=(role == 'super_admin'),
    )
    return Response({'id': user.id, 'username': user.username, 'role': user.role,
                     'message': f'User "{username}" created.'}, status=201)


@api_view(['PATCH'])
@permission_classes([IsAdmin])
def update_user(request, user_id):
    """Update role, email, active status, profile or permissions."""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=404)

    for field in ('role', 'email', 'is_active', 'full_name', 'phone', 'department'):
        if field in request.data:
            setattr(user, field, request.data[field])

    if 'custom_permissions' in request.data:
        user.custom_permissions = request.data['custom_permissions']

    if 'role' in request.data:
        user.is_staff     = user.role in ('super_admin', 'admin')
        user.is_superuser = (user.role == 'super_admin')

    user.save()
    return Response({'message': 'User updated.', 'custom_permissions': user.custom_permissions})


@api_view(['POST'])
@permission_classes([IsAdmin])
def set_password(request, user_id):
    """Set or reset a user's password."""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=404)

    password = request.data.get('password', '')
    if not password:
        return Response({'error': 'password is required.'}, status=400)

    try:
        validate_password(password, user)
    except ValidationError as e:
        return Response({'error': list(e.messages)}, status=400)

    user.set_password(password)
    user.save()
    return Response({'message': f'Password updated for "{user.username}".'})


@api_view(['DELETE'])
@permission_classes([IsAdmin])
def delete_user(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=404)
    username = user.username
    user.delete()
    return Response({'message': f'User "{username}" deleted.'})


# ── Custom Roles ─────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdmin])
def list_custom_roles(request):
    roles = CustomRole.objects.all().order_by('name')
    return Response([{'id': r.id, 'name': r.name, 'permissions': r.permissions} for r in roles])


@api_view(['POST'])
@permission_classes([IsAdmin])
def create_custom_role(request):
    name = request.data.get('name', '').strip()
    permissions = request.data.get('permissions', [])
    if not name:
        return Response({'error': 'name is required.'}, status=400)
    if CustomRole.objects.filter(name__iexact=name).exists():
        return Response({'error': f'Role "{name}" already exists.'}, status=400)
    role = CustomRole.objects.create(name=name, permissions=permissions)
    return Response({'id': role.id, 'name': role.name, 'permissions': role.permissions}, status=201)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAdmin])
def custom_role_detail(request, role_id):
    try:
        role = CustomRole.objects.get(id=role_id)
    except CustomRole.DoesNotExist:
        return Response({'error': 'Role not found.'}, status=404)
    if request.method == 'DELETE':
        role.delete()
        return Response({'message': 'Role deleted.'})
    if 'name' in request.data:
        role.name = request.data['name']
    if 'permissions' in request.data:
        role.permissions = request.data['permissions']
    role.save()
    return Response({'id': role.id, 'name': role.name, 'permissions': role.permissions})


@api_view(['POST'])
@permission_classes([IsAdmin])
def convert_faculty_to_user(request):
    """Convert a Faculty record into a system User with role + permissions."""
    from faculty.models import Faculty
    faculty_id   = request.data.get('faculty_id')
    role         = request.data.get('role', 'faculty')
    username     = request.data.get('username', '').strip()
    password     = request.data.get('password', '')
    permissions  = request.data.get('custom_permissions', [])
    custom_role_id = request.data.get('custom_role_id')

    if not all([faculty_id, username, password]):
        return Response({'error': 'faculty_id, username and password are required.'}, status=400)

    try:
        faculty = Faculty.objects.get(id=faculty_id)
    except Faculty.DoesNotExist:
        return Response({'error': 'Faculty not found.'}, status=404)

    if User.objects.filter(username=username).exists():
        return Response({'error': f'Username "{username}" already taken.'}, status=400)

    try:
        validate_password(password)
    except ValidationError as e:
        return Response({'error': list(e.messages)}, status=400)

    custom_role_obj = None
    if custom_role_id:
        try:
            custom_role_obj = CustomRole.objects.get(id=custom_role_id)
            role = 'custom'
            permissions = custom_role_obj.permissions
        except CustomRole.DoesNotExist:
            return Response({'error': 'Custom role not found.'}, status=404)

    user = User.objects.create_user(
        username=username,
        email=faculty.email,
        password=password,
        role=role,
        full_name=f'{faculty.first_name} {faculty.last_name}',
        phone=faculty.phone,
        department=faculty.department,
        custom_permissions=permissions,
        custom_role=custom_role_obj,
        is_staff=(role in ('super_admin', 'admin')),
        is_superuser=(role == 'super_admin'),
    )
    return Response({'id': user.id, 'username': user.username, 'role': user.role,
                     'message': f'Faculty converted to user "{username}".'}, status=201)


# ── Legacy ───────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAdmin])
def assign_role(request):
    email = request.data.get('email', '').strip()
    role  = request.data.get('role', '').strip()
    if not email or not role:
        return Response({'error': 'email and role are required.'}, status=400)
    user = User.objects.filter(email=email).first()
    if not user:
        username = email.split('@')[0]
        base, counter = username, 1
        while User.objects.filter(username=username).exists():
            username = f'{base}{counter}'; counter += 1
        user = User.objects.create_user(username=username, email=email, password=None, role=role)
    else:
        user.role = role
    user.save()
    return Response({'message': f'Role "{role}" assigned to {user.username}.'})


@api_view(['POST'])
@permission_classes([IsAdmin])
def set_user_password(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')
    email    = request.data.get('email', '').strip()
    if not all([username, password, email]):
        return Response({'error': 'username, password and email are required.'}, status=400)
    try:
        validate_password(password)
    except ValidationError as e:
        return Response({'error': list(e.messages)}, status=400)
    user = User.objects.filter(email=email).first()
    if user:
        user.set_password(password); user.username = username; user.save()
        return Response({'message': f'Password updated for "{username}".'})
    if User.objects.filter(username=username).exists():
        return Response({'error': f'Username "{username}" is already taken.'}, status=400)
    User.objects.create_user(username=username, email=email, password=password, role='faculty')
    return Response({'message': f'Login account created. Username: {username}'}, status=201)


@api_view(['POST'])
def change_password(request):
    username     = request.data.get('username')
    new_password = request.data.get('new_password')
    if not username or not new_password:
        return Response({'error': 'username and new_password are required'}, status=400)
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    try:
        validate_password(new_password, user)
    except ValidationError as e:
        return Response({'error': list(e.messages)}, status=400)
    user.set_password(new_password); user.save()
    return Response({'message': 'Password changed successfully'})


@api_view(['POST'])
@permission_classes([IsAdmin])
def create_student_account(request):
    student_id = request.data.get('student_id')
    password   = request.data.get('password')
    if not student_id or not password:
        return Response({'error': 'student_id and password are required'}, status=400)
    try:
        student = Student.objects.get(id=student_id)
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)
    username = student.register_number or student.roll_number
    user = User.objects.filter(username=username).first()
    if user:
        user.set_password(password); user.save()
        return Response({'message': f'Password updated for {username}'})
    User.objects.create_user(username=username, password=password, role='student', linked_student=student)
    return Response({'message': f'Account created. Username: {username}'}, status=201)
