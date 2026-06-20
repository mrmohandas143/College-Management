from rest_framework import serializers
from .models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'password', 'linked_student']

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            role=validated_data.get('role', 'student'),
            password=validated_data['password'],
            linked_student=validated_data.get('linked_student'),
        )


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role']               = user.role
        token['username']           = user.username
        token['email']              = user.email
        token['linked_student_id']  = user.linked_student_id
        token['is_super_admin']     = user.role == 'super_admin'
        return token
