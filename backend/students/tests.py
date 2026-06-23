from rest_framework.test import APITestCase
from rest_framework import status
from accounts.models import User
from students.models import Student

class StudentAPITest(APITestCase):
    def setUp(self):
        # Create student record
        self.student = Student.objects.create(
            first_name="Test",
            last_name="Student",
            email="teststudent@collegems.edu.in",
            gender="male",
            course="B.E Computer Science",
            roll_number="CSE23099",
            register_number="CSE23099"
        )
        
        # Create user accounts
        self.student_user = User.objects.create_user(
            username="student_user",
            password="testpassword",
            role="student",
            linked_student=self.student,
            email="teststudent@collegems.edu.in"
        )
        self.parent_user = User.objects.create_user(
            username="parent_user",
            password="testpassword",
            role="parent",
            linked_student=self.student,
            email="parent@collegems.edu.in"
        )
        self.faculty_user = User.objects.create_user(
            username="faculty_user",
            password="testpassword",
            role="faculty",
            email="faculty@collegems.edu.in"
        )
        self.admin_user = User.objects.create_user(
            username="admin_user",
            password="testpassword",
            role="admin",
            email="admin@collegems.edu.in"
        )

    def test_student_detail_access(self):
        # Student viewing own profile
        self.client.force_authenticate(user=self.student_user)
        url = f"/api/students/{self.student.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.student.id)

        # Student trying to view someone else's profile
        other_student = Student.objects.create(
            first_name="Other",
            last_name="Student",
            email="other@collegems.edu.in",
            gender="female",
            course="B.E Computer Science",
            roll_number="CSE23098",
            register_number="CSE23098"
        )
        other_url = f"/api/students/{other_student.id}/"
        response = self.client.get(other_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Faculty viewing student profile
        self.client.force_authenticate(user=self.faculty_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Admin viewing student profile
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_student_list_access(self):
        # Create another student
        other_student = Student.objects.create(
            first_name="Other",
            last_name="Student",
            email="other@collegems.edu.in",
            gender="female",
            course="B.E Computer Science",
            roll_number="CSE23098",
            register_number="CSE23098"
        )

        # Student list query (should only return self)
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get("/api/students/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.student.id)

        # Faculty list query (should return all students)
        self.client.force_authenticate(user=self.faculty_user)
        response = self.client.get("/api/students/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 2)
