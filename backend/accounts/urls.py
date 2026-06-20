from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    register_user, CustomTokenObtainPairView,
    create_student_account, change_password,
    assign_role, set_user_password,
    list_users, create_system_user, update_user, set_password, delete_user,
    list_custom_roles, create_custom_role, custom_role_detail,
    convert_faculty_to_user,
)

urlpatterns = [
    path('register/',               register_user),
    path('login/',                  CustomTokenObtainPairView.as_view()),
    path('refresh/',                TokenRefreshView.as_view()),
    path('change-password/',        change_password),
    path('create-student-account/', create_student_account),
    path('assign-role/',            assign_role),
    path('set-user-password/',      set_user_password),
    # User Management
    path('users/',                              list_users),
    path('users/create/',                       create_system_user),
    path('users/<int:user_id>/',                update_user),
    path('users/<int:user_id>/set-password/',   set_password),
    path('users/<int:user_id>/delete/',         delete_user),
    # Custom Roles
    path('custom-roles/',                       list_custom_roles),
    path('custom-roles/create/',                create_custom_role),
    path('custom-roles/<int:role_id>/',         custom_role_detail),
    # Faculty → User conversion
    path('convert-faculty/',                    convert_faculty_to_user),
]
