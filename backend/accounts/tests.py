from rest_framework.test import APITestCase
from rest_framework import status
from django.core import mail
from accounts.models import User

class FacultyCredentialsTest(APITestCase):
    def setUp(self):
        # Create admin user for authentication
        self.admin_user = User.objects.create_user(
            username="admin_user",
            password="adminpassword",
            role="admin",
            email="admin@collegems.edu.in"
        )
        # Create a non-admin user
        self.faculty_user = User.objects.create_user(
            username="faculty_user",
            password="facpassword",
            role="faculty",
            email="faculty@collegems.edu.in"
        )

    def test_send_credentials_unauthenticated(self):
        url = "/api/accounts/send-faculty-credentials/"
        data = {
            "username": "john.doe",
            "password": "SecurePassword123!",
            "email": "john.doe@collegems.edu.in",
            "name": "John Doe"
        }
        response = self.client.post(url, data, format='json')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_send_credentials_non_admin(self):
        self.client.force_authenticate(user=self.faculty_user)
        url = "/api/accounts/send-faculty-credentials/"
        data = {
            "username": "john.doe",
            "password": "SecurePassword123!",
            "email": "john.doe@collegems.edu.in",
            "name": "John Doe"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_send_credentials_success(self):
        self.client.force_authenticate(user=self.admin_user)
        url = "/api/accounts/send-faculty-credentials/"
        data = {
            "username": "john.doe",
            "password": "SecurePassword123!",
            "email": "john.doe@collegems.edu.in",
            "name": "John Doe"
        }
        
        # Ensure outbox is empty before
        mail.outbox = []

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], "john.doe")
        self.assertEqual(response.data['password'], "SecurePassword123!")
        self.assertIn("sent", response.data['message'])

        # Verify database record
        user = User.objects.get(username="john.doe")
        self.assertEqual(user.email, "john.doe@collegems.edu.in")
        self.assertEqual(user.full_name, "John Doe")
        self.assertEqual(user.role, "faculty")
        self.assertTrue(user.check_password("SecurePassword123!"))

        # Verify email was sent via outbox
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, 'Your Faculty Account Credentials')
        self.assertIn("john.doe", mail.outbox[0].body)
        self.assertIn("SecurePassword123!", mail.outbox[0].body)
        self.assertEqual(mail.outbox[0].to, ["john.doe@collegems.edu.in"])

    def test_send_credentials_username_exists(self):
        self.client.force_authenticate(user=self.admin_user)
        # Create user with same username
        User.objects.create_user(
            username="john.doe",
            password="oldpassword",
            role="faculty",
            email="another@collegems.edu.in"
        )
        url = "/api/accounts/send-faculty-credentials/"
        data = {
            "username": "john.doe",
            "password": "SecurePassword123!",
            "email": "john.doe@collegems.edu.in",
            "name": "John Doe"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("taken", response.data['error'])

    def test_send_credentials_missing_fields(self):
        self.client.force_authenticate(user=self.admin_user)
        url = "/api/accounts/send-faculty-credentials/"
        data = {
            "username": "john.doe",
            # missing password and email
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

