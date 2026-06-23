# pyrefly: ignore [missing-import]
import datetime
import random
# pyrefly: ignore [missing-import]
from django.core.management.base import BaseCommand
# pyrefly: ignore [missing-import]
from django.db import transaction
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from django.utils import timezone

# Import all models
from departments.models import Department
from accounts.models import CustomRole, User
from faculty.models import Faculty
from hr.models import Employee, Attendance as EmployeeAttendance, LeaveRequest as EmployeeLeave, PayrollConfig, Payroll
from students.models import Student
from academics.models import Subject, AcademicCalendar
from attendance.models import AttendanceSession, StudentAttendance
from fees.models import FeeStructure, Fee
from examination.models import Exam, ExamResult
from timetable.models import TimetableEntry
from hostel.models import HostelBlock, Room, HostelAllotment, HostelFee, Visitor, LeaveRequest as HostelLeave, HostelComplaint, HostelApplication, HostelAttendance
from library.models import BookCategory, Book, BookIssue
from placement.models import Company, PlacementDrive, PlacementApplication
from transport.models import Route, Vehicle, TransportAllotment
from alumni.models import AlumniProfile, AlumniEvent, AlumniEventRegistration
from notifications.models import Notification

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds database with realistic mock data for all modules'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Starting database seeding...'))

        try:
            with transaction.atomic():
                self.clear_database()
                self.seed_all()
            self.stdout.write(self.style.SUCCESS('Successfully seeded all data!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Seeding failed: {str(e)}'))
            import traceback
            traceback.print_exc()

    def clear_database(self):
        self.stdout.write('Purging old records...')
        
        # Auxiliary / Secondary dependencies first
        Notification.objects.all().delete()
        AlumniEventRegistration.objects.all().delete()
        AlumniEvent.objects.all().delete()
        AlumniProfile.objects.all().delete()
        
        TransportAllotment.objects.all().delete()
        Vehicle.objects.all().delete()
        Route.objects.all().delete()
        
        PlacementApplication.objects.all().delete()
        PlacementDrive.objects.all().delete()
        Company.objects.all().delete()
        
        BookIssue.objects.all().delete()
        Book.objects.all().delete()
        BookCategory.objects.all().delete()
        
        HostelAttendance.objects.all().delete()
        HostelComplaint.objects.all().delete()
        HostelLeave.objects.all().delete()
        Visitor.objects.all().delete()
        HostelFee.objects.all().delete()
        HostelAllotment.objects.all().delete()
        Room.objects.all().delete()
        HostelBlock.objects.all().delete()
        HostelApplication.objects.all().delete()
        
        TimetableEntry.objects.all().delete()
        ExamResult.objects.all().delete()
        Exam.objects.all().delete()
        
        Fee.objects.all().delete()
        FeeStructure.objects.all().delete()
        
        StudentAttendance.objects.all().delete()
        AttendanceSession.objects.all().delete()
        
        AcademicCalendar.objects.all().delete()
        Subject.objects.all().delete()
        
        Payroll.objects.all().delete()
        PayrollConfig.objects.all().delete()
        EmployeeLeave.objects.all().delete()
        EmployeeAttendance.objects.all().delete()
        Employee.objects.all().delete()
        
        Student.objects.all().delete()
        Faculty.objects.all().delete()
        
        # User accounts (except superadmin Das, or keep standard logins)
        User.objects.exclude(username='Das').delete()
        CustomRole.objects.all().delete()
        Department.objects.all().delete()
        
        self.stdout.write(self.style.SUCCESS('Purge complete.'))

    def seed_all(self):
        # 1. Departments
        self.stdout.write('Seeding Departments...')
        depts_data = [
            ('Computer Science', 'CS', 'Dr. Rajesh Kumar'),
            ('Electronics', 'EC', 'Dr. Amit Sharma'),
            ('Mechanical', 'ME', 'Dr. Vikram Singh'),
            ('Civil', 'CE', 'Dr. Meera Nair'),
            ('Mathematics', 'MA', 'Dr. Sunita Rao'),
            ('Commerce', 'CO', 'Dr. Rajesh Prasad'),
            ('Management', 'MG', 'Dr. Ananya Sen'),
        ]
        depts = {}
        for name, code, head in depts_data:
            dept = Department.objects.create(
                name=name,
                code=code,
                description=f'Department of {name}. Focuses on academic excellence and research.',
                head=head
            )
            depts[code] = dept

        # 2. Custom Roles
        self.stdout.write('Seeding Custom Roles...')
        roles = {}
        role_names = ['Academic Coordinator', 'Department Head', 'Lab Assistant']
        for name in role_names:
            role = CustomRole.objects.create(
                name=name,
                permissions=['view_reports', 'manage_timetable', 'view_attendance']
            )
            roles[name] = role

        # 3. Core Login Accounts
        self.stdout.write('Seeding Standard Logins...')
        USERS = [
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
        for username, password, role, email, is_staff, is_superuser in USERS:
            User.objects.create_user(
                username=username,
                password=password,
                email=email,
                role=role,
                is_staff=is_staff,
                is_superuser=is_superuser,
                full_name=username.replace('_', ' ').title(),
                phone='+919876543210'
            )

        # 4. Subjects
        self.stdout.write('Seeding Subjects...')
        subject_list = [
            # Computer Science
            ('Data Structures and Algorithms', 'CS301', 'B.Tech', 'CS', 3, 4, 'theory'),
            ('Computer Networks', 'CS502', 'B.Tech', 'CS', 5, 3, 'theory'),
            ('Operating Systems Lab', 'CS411', 'B.Tech', 'CS', 4, 2, 'practical'),
            ('Cloud Computing', 'CS703', 'B.Tech', 'CS', 7, 3, 'elective'),
            # Electronics
            ('Digital Electronics', 'EC301', 'B.Tech', 'EC', 3, 4, 'theory'),
            ('Microprocessors and Microcontrollers', 'EC502', 'B.Tech', 'EC', 5, 3, 'theory'),
            ('Communication Systems Lab', 'EC411', 'B.Tech', 'EC', 4, 2, 'practical'),
            # Mechanical
            ('Thermodynamics', 'ME301', 'B.Tech', 'ME', 3, 4, 'theory'),
            ('Fluid Mechanics', 'ME402', 'B.Tech', 'ME', 4, 3, 'theory'),
            # Civil
            ('Structural Analysis', 'CE501', 'B.Tech', 'CE', 5, 4, 'theory'),
            ('Surveying Lab', 'CE311', 'B.Tech', 'CE', 3, 2, 'practical'),
            # Mathematics
            ('Calculus & Linear Algebra', 'MA101', 'B.Sc', 'MA', 1, 4, 'theory'),
            ('Real Analysis', 'MA301', 'B.Sc', 'MA', 3, 4, 'theory'),
            # Commerce
            ('Financial Accounting', 'CO101', 'B.Com', 'CO', 1, 4, 'theory'),
            ('Corporate Law', 'CO301', 'B.Com', 'CO', 3, 3, 'theory'),
            # Management
            ('Principles of Management', 'MG101', 'MBA', 'MG', 1, 3, 'theory'),
            ('Strategic Management', 'MG301', 'MBA', 'MG', 3, 4, 'theory'),
        ]
        subjects = []
        for name, code, course, dept_code, sem, credits, stype in subject_list:
            sub = Subject.objects.create(
                name=name,
                code=code,
                course=course,
                department=depts[dept_code].name,
                semester=sem,
                credits=credits,
                subject_type=stype,
                faculty_name='',
                is_active=True
            )
            subjects.append(sub)

        # 5. Faculty & HR Employees
        self.stdout.write('Seeding Faculty and HR details...')
        faculty_data = [
            ('Aarav', 'Sharma', 'aarav.sharma@collegems.com', 'CS', 'B.Tech', 'Professor', 'Ph.D. in AI', 15),
            ('Aditi', 'Patel', 'aditi.patel@collegems.com', 'CS', 'B.Tech', 'Assistant Professor', 'M.Tech in CSE', 5),
            ('Bhavya', 'Rao', 'bhavya.rao@collegems.com', 'EC', 'B.Tech', 'Associate Professor', 'Ph.D. in VLSI', 10),
            ('Dev', 'Joshi', 'dev.joshi@collegems.com', 'ME', 'B.Tech', 'Assistant Professor', 'M.Tech in Thermal', 6),
            ('Ishaan', 'Mehta', 'ishaan.mehta@collegems.com', 'CE', 'B.Tech', 'Professor', 'Ph.D. in Structures', 12),
            ('Kavya', 'Menon', 'kavya.menon@collegems.com', 'MA', 'B.Sc', 'Assistant Professor', 'M.Sc in Mathematics', 4),
            ('Suresh', 'Kumar', 'suresh.kumar@collegems.com', 'CO', 'B.Com', 'Associate Professor', 'M.Com', 8),
            ('Ananya', 'Sen', 'ananya.sen@collegems.com', 'MG', 'MBA', 'Professor', 'MBA', 14),
        ]
        
        faculties = []
        employees = []
        
        today = datetime.date.today()
        
        for idx, (first, last, email, dept_code, course_name, desig, qual, exp) in enumerate(faculty_data, 1):
            # Create Faculty
            fac = Faculty.objects.create(
                first_name=first,
                last_name=last,
                email=email,
                phone=f'+91900000000{idx}',
                department=depts[dept_code].name,
                course=course_name,
                designation=desig,
                qualification=qual,
                experience=exp,
                status='active'
            )
            faculties.append(fac)
            
            # Distribute created_at across past months of 2026 for realistic growth chart
            month = random.randint(1, 6)
            created_date = datetime.datetime(2026, month, random.randint(1, 28), 10, 0, 0)
            Faculty.objects.filter(id=fac.id).update(created_at=created_date)
            
            # Associate subjects with faculty names (simplified)
            for sub in subjects:
                if sub.department == depts[dept_code].name and not sub.faculty_name:
                    sub.faculty_name = f"{first} {last}"
                    sub.save()

            # Create User Account for Faculty
            fac_username = f"faculty_{idx}"
            fac_user = User.objects.create_user(
                username=fac_username,
                password='Password@123',
                email=email,
                role='faculty',
                full_name=f"{first} {last}",
                phone=f'+91900000000{idx}',
                department=depts[dept_code].name
            )

            # Create Employee (Linked to Faculty and Department)
            emp = Employee.objects.create(
                employee_id=f"EMP{100 + idx}",
                first_name=first,
                last_name=last,
                email=email,
                phone=f'+91900000000{idx}',
                gender='male' if idx % 2 != 0 else 'female',
                date_of_birth=datetime.date(1980 + idx, 5, 12),
                address=f'Faculty Housing Qtr {idx}, Campus Road, TechCity',
                department=depts[dept_code],
                designation=desig,
                employment_type='full_time',
                date_of_joining=datetime.date(2018, 7, 1),
                basic_salary=50000.00 + (exp * 2000),
                status='active',
                faculty=fac
            )
            employees.append(emp)

            # Create PayrollConfig for Employee
            PayrollConfig.objects.create(
                employee=emp,
                hra_percent=20,
                ta_percent=10,
                pf_percent=12,
                tax_percent=10,
                other_allowances=1500.00,
                other_deductions=500.00
            )

        # 6. Academic Calendar
        self.stdout.write('Seeding Academic Calendar...')
        calendar_events = [
            ('Semester Start - Fall 2026', 'semester_start', today - datetime.timedelta(days=60), today - datetime.timedelta(days=60), 'Start of odd semester academic activities', '2026-27'),
            ('Independence Day', 'holiday', datetime.date(2026, 8, 15), datetime.date(2026, 8, 15), 'National Holiday', '2026-27'),
            ('Mid-Term Examination 1', 'exam', today - datetime.timedelta(days=20), today - datetime.timedelta(days=15), 'First Internal Assessments', '2026-27'),
            ('Technical Symposium', 'event', today + datetime.timedelta(days=10), today + datetime.timedelta(days=11), 'Annual national level technical fest', '2026-27'),
            ('Semester End Examinations', 'exam', today + datetime.timedelta(days=45), today + datetime.timedelta(days=60), 'University Semester Theory Exams', '2026-27'),
            ('Winter Break', 'holiday', today + datetime.timedelta(days=61), today + datetime.timedelta(days=75), 'Winter vacation for students and staff', '2026-27'),
        ]
        for title, etype, start, end, desc, ac_yr in calendar_events:
            AcademicCalendar.objects.create(
                title=title,
                event_type=etype,
                start_date=start,
                end_date=end,
                description=desc,
                academic_year=ac_yr
            )

        # 7. Fee Structures
        self.stdout.write('Seeding Fee Structures...')
        fee_types = [
            ('Tuition Fee B.Tech', 'tuition', 60000.00, 'B.Tech', 'Computer Science', 1),
            ('Tuition Fee B.Tech', 'tuition', 60000.00, 'B.Tech', 'Electronics', 1),
            ('Tuition Fee B.Tech', 'tuition', 60000.00, 'B.Tech', 'Mechanical', 1),
            ('Tuition Fee B.Tech', 'tuition', 60000.00, 'B.Tech', 'Civil', 1),
            ('Tuition Fee B.Sc', 'tuition', 40000.00, 'B.Sc', 'Mathematics', 1),
            ('Tuition Fee B.Com', 'tuition', 45000.00, 'B.Com', 'Commerce', 1),
            ('Tuition Fee MBA', 'tuition', 80000.00, 'MBA', 'Management', 1),
            ('Semester Exam Fee', 'exam', 2000.00, '', '', None),
            ('Central Library Fee', 'library', 1500.00, '', '', None),
            ('Central Sports Fee', 'sports', 1000.00, '', '', None),
        ]
        
        fee_structures = []
        for name, ftype, amt, course, dept_name, sem in fee_types:
            fs = FeeStructure.objects.create(
                name=name,
                fee_type=ftype,
                amount=amt,
                course=course,
                department=dept_name,
                semester=sem,
                academic_year='2026-27',
                is_active=True,
                description=f'Standard {ftype} for academic year 2026-27.'
            )
            fee_structures.append(fs)

        # 8. Students
        self.stdout.write('Seeding Students & linked accounts...')
        students_data = [
            # Computer Science (B.Tech)
            ('Rohan', 'Das', 'rohan.das@gmail.com', 'CS', 'B.Tech', 3, 'CS24001', 9.25),
            ('Neha', 'Sen', 'neha.sen@gmail.com', 'CS', 'B.Tech', 3, 'CS24002', 8.90),
            ('Arjun', 'Verma', 'arjun.v@gmail.com', 'CS', 'B.Tech', 1, 'CS26001', 7.80),
            ('Pooja', 'Pillai', 'pooja.p@gmail.com', 'CS', 'B.Tech', 4, 'CS23001', 8.50),
            # Electronics (B.Tech)
            ('Siddharth', 'Joshi', 'sid.j@gmail.com', 'EC', 'B.Tech', 3, 'EC24001', 8.10),
            ('Riya', 'Singh', 'riya.singh@gmail.com', 'EC', 'B.Tech', 3, 'EC24002', 8.45),
            ('Vijay', 'Prasad', 'vijay.p@gmail.com', 'EC', 'B.Tech', 4, 'EC23001', 7.50),
            # Mechanical (B.Tech)
            ('Vikram', 'Rathore', 'vikram.r@gmail.com', 'ME', 'B.Tech', 3, 'ME24001', 7.20),
            ('Karan', 'Johar', 'karan.j@gmail.com', 'ME', 'B.Tech', 4, 'ME23001', 7.90),
            # Civil (B.Tech)
            ('Suresh', 'Raina', 'suresh.r@gmail.com', 'CE', 'B.Tech', 3, 'CE24001', 7.15),
            ('Divya', 'Dutta', 'divya.d@gmail.com', 'CE', 'B.Tech', 3, 'CE24002', 8.30),
            # Mathematics (B.Sc)
            ('Anjali', 'Gupta', 'anjali.g@gmail.com', 'MA', 'B.Sc', 3, 'MA24001', 7.95),
            ('Manish', 'Nair', 'manish.nair@gmail.com', 'MA', 'B.Sc', 3, 'MA24002', 8.20),
            # Commerce (B.Com)
            ('Rahul', 'Dravid', 'rahul.d@gmail.com', 'CO', 'B.Com', 3, 'CO24001', 8.65),
            ('Sourav', 'Ganguly', 'sourav.g@gmail.com', 'CO', 'B.Com', 3, 'CO24002', 7.45),
            # Management (MBA)
            ('Amit', 'Shah', 'amit.s@gmail.com', 'MG', 'MBA', 2, 'MG25001', 9.10),
            ('Narendra', 'Modi', 'narendra.m@gmail.com', 'MG', 'MBA', 2, 'MG25002', 9.80),
        ]
        
        students = []
        for idx, (first, last, email, dept_code, course_name, sem, roll, cgpa) in enumerate(students_data, 1):
            # Create Student record (triggers pending fees generation)
            stud = Student.objects.create(
                first_name=first,
                last_name=last,
                email=email,
                phone=f'+9188888888{idx:02d}',
                gender='male' if idx % 2 != 0 else 'female',
                date_of_birth=datetime.date(2005 + (3 - sem)//2, (idx % 12) or 12, 10),
                address=f'Student Res. Flat {idx*3}, Tech Avenue, Metroside',
                course=course_name,
                department=depts[dept_code].name,
                year=(sem + 1) // 2,
                roll_number=roll,
                status='active',
                cgpa=cgpa,
                attendance_percentage=random.randint(75, 95)
            )
            students.append(stud)

            # Distribute created_at across past months of 2026 for realistic growth chart
            month = random.randint(1, 6)
            created_date = datetime.datetime(2026, month, random.randint(1, 28), 10, 0, 0)
            Student.objects.filter(id=stud.id).update(created_at=created_date)

            # Create User account for Student
            stud_user = User.objects.create_user(
                username=roll,
                password='Password@123',
                email=email,
                role='student',
                linked_student=stud,
                full_name=f"{first} {last}",
                phone=f'+9188888888{idx:02d}',
                department=depts[dept_code].name
            )

            # Create Parent Account for student (linked)
            parent_user = User.objects.create_user(
                username=f"parent_{roll}",
                password='Password@123',
                email=f"parent.{roll.lower()}@gmail.com",
                role='parent',
                linked_student=stud,
                full_name=f"Mr. {last}",
                phone=f'+9177777777{idx:02d}'
            )

        # Let's customize fees (Paid/Overdue statuses)
        self.stdout.write('Adjusting generated student fees statuses...')
        for idx, stud in enumerate(students):
            # Fetch automatically generated fees
            student_fees = Fee.objects.filter(student=stud)
            for f_idx, fee in enumerate(student_fees):
                if idx % 2 == 0 and f_idx == 0:
                    fee.status = 'paid'
                    fee.payment_mode = 'online'
                    fee.transaction_id = f'TXN{random.randint(100000, 999999)}'
                    fee.paid_date = today - datetime.timedelta(days=15)
                    fee.save()
                elif idx % 4 == 3 and f_idx == 0:
                    fee.status = 'overdue'
                    fee.save()

        # 9. Attendance Logs (Past 5 days for students)
        self.stdout.write('Seeding Student Attendance sessions & logs...')
        for d_offset in range(5):
            class_date = today - datetime.timedelta(days=d_offset)
            if class_date.weekday() >= 5: # Skip weekends
                continue
            
            for p_idx, (dept_code, dept_obj) in enumerate(depts.items(), 1):
                # Let's hold a session for first subject in dept
                dept_subs = [s for s in subjects if s.department == dept_obj.name]
                if not dept_subs:
                    continue
                sub = dept_subs[0]
                
                # Session
                session = AttendanceSession.objects.create(
                    date=class_date,
                    course=sub.course,
                    department=dept_obj.name,
                    subject=sub.name,
                    faculty_name=sub.faculty_name,
                    period=p_idx
                )
                
                # Mark attendance for student in this department
                dept_students = [s for s in students if s.department == dept_obj.name]
                for stud in dept_students:
                    status = 'present' if random.random() > 0.1 else random.choice(['absent', 'late'])
                    StudentAttendance.objects.create(
                        session=session,
                        student=stud,
                        status=status,
                        remarks='Class attendance'
                    )

        # 10. Timetable Entries
        self.stdout.write('Seeding Timetable entries...')
        days_of_week = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        # Let's seed timetable for B.Tech Computer Science Semester 3
        cse_subs = [s for s in subjects if s.department == depts['CS'].name]
        if len(cse_subs) >= 2:
            for day in days_of_week:
                for period in [1, 2, 3, 4]:
                    sub = cse_subs[period % len(cse_subs)]
                    TimetableEntry.objects.create(
                        course='B.Tech',
                        department=depts['CS'].name,
                        semester=3,
                        day=day,
                        period=period,
                        start_time=datetime.time(9 + period, 0),
                        end_time=datetime.time(10 + period, 0),
                        subject=sub.name,
                        subject_code=sub.code,
                        faculty_name=sub.faculty_name,
                        room=f"Room {100 + period}",
                        academic_year='2026-27'
                    )

        # 11. Exams & Exam Results
        self.stdout.write('Seeding Exams and Results...')
        cse_students = [s for s in students if s.department == depts['CS'].name]
        
        # Internal Exam 1
        exam1 = Exam.objects.create(
            name='First Sessional Internal Exam',
            exam_type='internal',
            course='B.Tech',
            department=depts['CS'].name,
            semester=3,
            subject=subjects[0].name,
            subject_code=subjects[0].code,
            exam_date=today - datetime.timedelta(days=18),
            start_time=datetime.time(10, 0),
            end_time=datetime.time(11, 30),
            room='Exam Hall A',
            max_marks=50,
            pass_marks=20,
            status='completed',
            academic_year='2026-27'
        )
        
        for stud in cse_students:
            marks = float(random.randint(22, 49))
            ExamResult.objects.create(
                exam=exam1,
                student=stud,
                marks_obtained=marks,
                entered_by='Prof. Aarav Sharma'
            )

        # Upcoming exam
        Exam.objects.create(
            name='Second Sessional Internal Exam',
            exam_type='internal',
            course='B.Tech',
            department=depts['CS'].name,
            semester=3,
            subject=subjects[0].name,
            subject_code=subjects[0].code,
            exam_date=today + datetime.timedelta(days=12),
            start_time=datetime.time(10, 0),
            end_time=datetime.time(11, 30),
            room='Exam Hall A',
            max_marks=50,
            pass_marks=20,
            status='scheduled',
            academic_year='2026-27'
        )

        # 12. HR Payroll & Leave
        self.stdout.write('Seeding Employee Payroll, Leaves, and Attendance logs...')
        for emp in employees:
            # Generate past month payroll (Paid)
            prev_month = (today.month - 2) % 12 + 1
            prev_year = today.year if today.month > 1 else today.year - 1
            
            gross = emp.basic_salary * 1.30  # basic + HRA (20%) + TA (10%)
            pf = emp.basic_salary * 0.12
            tax = gross * 0.10
            ded = pf + tax + 500.00
            net = gross - ded
            
            Payroll.objects.create(
                employee=emp,
                month=prev_month,
                year=prev_year,
                working_days=26,
                present_days=25,
                absent_days=1,
                basic_salary=emp.basic_salary,
                hra=emp.basic_salary * 0.20,
                ta=emp.basic_salary * 0.10,
                other_allowances=1500.00,
                gross_salary=gross,
                pf_deduction=pf,
                tax_deduction=tax,
                other_deductions=500.00,
                total_deductions=ded,
                net_salary=net,
                status='paid',
                paid_on=datetime.date(prev_year, prev_month, 28)
            )

            # Seed Employee Attendance for past 7 days
            for i in range(1, 8):
                att_date = today - datetime.timedelta(days=i)
                if att_date.weekday() < 5:
                    status = 'present' if random.random() > 0.05 else 'absent'
                    check_in = datetime.time(9, random.randint(0, 15)) if status == 'present' else None
                    check_out = datetime.time(17, random.randint(0, 15)) if status == 'present' else None
                    EmployeeAttendance.objects.create(
                        employee=emp,
                        date=att_date,
                        status=status,
                        check_in=check_in,
                        check_out=check_out
                    )

            # Leave Request
            EmployeeLeave.objects.create(
                employee=emp,
                leave_type='sick',
                from_date=today - datetime.timedelta(days=12),
                to_date=today - datetime.timedelta(days=11),
                reason='Viral fever and doctor-prescribed rest',
                status='approved',
                remarks='Approved based on medical certificate.'
            )

        # 13. Hostel block & rooms & assignments
        self.stdout.write('Seeding Hostel Blocks and rooms...')
        boys_block = HostelBlock.objects.create(name='Dr. C.V. Raman Hall (Boys)', gender='male', warden='Dr. Vikram Singh', capacity=150)
        girls_block = HostelBlock.objects.create(name='Mother Teresa Hall (Girls)', gender='female', warden='Dr. Sunita Rao', capacity=120)

        # Create rooms in Boys Block
        rooms = []
        for flr in [1, 2]:
            for r_num in range(101, 106):
                room = Room.objects.create(
                    block=boys_block,
                    room_number=f"{flr * 100 + r_num % 100}",
                    room_type='double',
                    capacity=2,
                    occupied=0,
                    status='available',
                    floor=flr
                )
                rooms.append(room)
        # Create rooms in Girls Block
        for flr in [1, 2]:
            for r_num in range(101, 106):
                room = Room.objects.create(
                    block=girls_block,
                    room_number=f"{flr * 100 + r_num % 100}",
                    room_type='single',
                    capacity=1,
                    occupied=0,
                    status='available',
                    floor=flr
                )
                rooms.append(room)

        # Allot hostel rooms to some students
        self.stdout.write('Seeding Hostel Allotments and student activity...')
        allotments = []
        male_students = [s for s in students if s.gender == 'male'][:4]
        female_students = [s for s in students if s.gender == 'female'][:4]

        # Allocate Boys
        for idx, m_stud in enumerate(male_students):
            room = rooms[idx // 2]
            allot = HostelAllotment.objects.create(
                room=room,
                student_name=f"{m_stud.first_name} {m_stud.last_name}",
                student_id=m_stud.roll_number,
                contact=m_stud.phone,
                allotment_date=today - datetime.timedelta(days=45),
                status='active'
            )
            allotments.append(allot)
            room.occupied += 1
            if room.occupied >= room.capacity:
                room.status = 'occupied'
            room.save()

        # Allocate Girls
        for idx, f_stud in enumerate(female_students):
            # Single rooms start at index 10 in our rooms list
            room = rooms[10 + idx]
            allot = HostelAllotment.objects.create(
                room=room,
                student_name=f"{f_stud.first_name} {f_stud.last_name}",
                student_id=f_stud.roll_number,
                contact=f_stud.phone,
                allotment_date=today - datetime.timedelta(days=45),
                status='active'
            )
            allotments.append(allot)
            room.occupied += 1
            room.status = 'occupied'
            room.save()

        # Seed Hostel Fee for allotments
        for allot in allotments:
            HostelFee.objects.create(
                allotment=allot,
                month='June 2026',
                amount=4500.00,
                due_date=today + datetime.timedelta(days=5),
                status='pending'
            )
            # Add hostel attendance
            HostelAttendance.objects.create(
                allotment=allot,
                date=today - datetime.timedelta(days=1),
                check_in=datetime.time(20, 15),
                check_out=datetime.time(7, 30),
                present=True
            )

        # Seed Visitor
        Visitor.objects.create(
            student_name=allotments[0].student_name,
            student_id=allotments[0].student_id,
            visitor_name='Rajesh Das',
            relation='Father',
            contact='+919900990099',
            purpose='Parental visit and dropping off materials',
            check_in=timezone.now() - datetime.timedelta(hours=4),
            check_out=timezone.now() - datetime.timedelta(hours=1)
        )

        # Seed Hostel Complaint
        HostelComplaint.objects.create(
            room=allotments[0].room,
            student_name=allotments[0].student_name,
            complaint='Wi-Fi connection is highly unstable in the room.',
            status='in_progress'
        )

        # Seed Hostel Application
        HostelApplication.objects.create(
            student_name=students[8].first_name + ' ' + students[8].last_name,
            student_id=students[8].roll_number,
            contact=students[8].phone,
            gender=students[8].gender,
            preferred_block=boys_block if students[8].gender == 'male' else girls_block,
            reason='Living far from college campus. Long daily travel time.',
            status='pending'
        )

        # Hostel Leave Request
        HostelLeave.objects.create(
            student_name=allotments[1].student_name,
            student_id=allotments[1].student_id,
            room=allotments[1].room,
            from_date=today + datetime.timedelta(days=2),
            to_date=today + datetime.timedelta(days=4),
            reason='Going home for family function',
            status='pending'
        )

        # 14. Library
        self.stdout.write('Seeding Library setup and books...')
        cat_cs = BookCategory.objects.create(name='Computer Science')
        cat_ec = BookCategory.objects.create(name='Electronics')
        cat_math = BookCategory.objects.create(name='Mathematics & Science')
        
        b1 = Book.objects.create(title='Introduction to Algorithms', author='Thomas H. Cormen', isbn='9780262033848', category=cat_cs, publisher='MIT Press', edition='3rd', total_copies=5, available_copies=4, rack_number='R-12-A')
        b2 = Book.objects.create(title='Computer Networks', author='Andrew S. Tanenbaum', isbn='9780132126953', category=cat_cs, publisher='Prentice Hall', edition='5th', total_copies=3, available_copies=3, rack_number='R-12-B')
        b3 = Book.objects.create(title='Digital Systems', author='Ronald J. Tocci', isbn='9780135103821', category=cat_ec, publisher='Pearson', edition='10th', total_copies=4, available_copies=3, rack_number='R-08-D')
        
        # Book Issue
        BookIssue.objects.create(
            book=b1,
            member_name=f"{students[0].first_name} {students[0].last_name}",
            member_type='student',
            member_id=students[0].roll_number,
            issue_date=today - datetime.timedelta(days=10),
            due_date=today + datetime.timedelta(days=4),
            status='issued'
        )
        
        BookIssue.objects.create(
            book=b3,
            member_name=f"{students[7].first_name} {students[7].last_name}",
            member_type='student',
            member_id=students[7].roll_number,
            issue_date=today - datetime.timedelta(days=20),
            due_date=today - datetime.timedelta(days=6),
            status='overdue',
            fine_amount=70.00
        )

        # 15. Placements
        self.stdout.write('Seeding Placements drives and applications...')
        comp_g = Company.objects.create(name='Google India', industry='Technology', website='https://google.com', contact_person='Amit Patel', contact_email='careers-india@google.com', contact_phone='+911122334455')
        comp_t = Company.objects.create(name='TCS', industry='IT Services', website='https://tcs.com', contact_person='Simran Kaur', contact_email='campus-hiring@tcs.com')
        
        drive1 = PlacementDrive.objects.create(
            company=comp_g,
            title='Software Engineer Intern - 2026',
            drive_date=today + datetime.timedelta(days=25),
            venue='Auditorium 1',
            package_lpa=32.50,
            eligible_courses='B.Tech',
            min_cgpa=8.50,
            status='upcoming',
            description='We are hiring passionate software engineering interns for Google India offices.'
        )
        
        drive2 = PlacementDrive.objects.create(
            company=comp_t,
            title='TCS Ninja Campus Hiring',
            drive_date=today - datetime.timedelta(days=12),
            venue='Online Campus Portal',
            package_lpa=3.60,
            eligible_courses='B.Tech, B.Sc, B.Com, MBA',
            min_cgpa=6.00,
            status='completed',
            description='National level recruitment drive for entry level engineers.'
        )

        # Placement Application for TCS (Completed/Selected/Rejected)
        for stud in students[:4]:
            status = 'selected' if stud.cgpa >= 8.5 else 'applied'
            PlacementApplication.objects.create(
                drive=drive2,
                student_name=f"{stud.first_name} {stud.last_name}",
                student_id=stud.roll_number,
                course=stud.course,
                cgpa=stud.cgpa or 0,
                status=status,
                offer_letter=(status == 'selected'),
                package_lpa=3.60 if status == 'selected' else None
            )

        # Placement Application for Google (Upcoming drive)
        cse_eligible = [s for s in students if s.department == depts['CS'].name and s.cgpa >= 8.5]
        for stud in cse_eligible:
            PlacementApplication.objects.create(
                drive=drive1,
                student_name=f"{stud.first_name} {stud.last_name}",
                student_id=stud.roll_number,
                course=stud.course,
                cgpa=stud.cgpa,
                status='applied'
            )

        # 16. Transport
        self.stdout.write('Seeding Transport routes, vehicles and allotments...')
        route1 = Route.objects.create(name='Route 1 - East Line', start_point='Central Station', end_point='College Campus', distance_km=22.50, stops='Central Station, Metro Hub, Gandhi Nagar, College Gates', fare=2500.00)
        route2 = Route.objects.create(name='Route 2 - North Line', start_point='Airport Circle', end_point='College Campus', distance_km=30.00, stops='Airport Circle, Palace Road, City Mall, College Gates', fare=3200.00)

        v1 = Vehicle.objects.create(reg_number='KA-03-F-1234', vehicle_type='Standard Bus', capacity=50, driver_name='Ramesh Prasad', driver_phone='+919988776655', route=route1, status='active')
        v2 = Vehicle.objects.create(reg_number='KA-03-F-5678', vehicle_type='AC Coach Bus', capacity=40, driver_name='Somappa Gowda', driver_phone='+919988774433', route=route2, status='active')

        # Transport allotments
        TransportAllotment.objects.create(
            student_name=f"{students[0].first_name} {students[0].last_name}",
            student_id=students[0].roll_number,
            route=route1,
            vehicle=v1,
            boarding_stop='Gandhi Nagar',
            valid_from=today - datetime.timedelta(days=60),
            is_active=True
        )
        TransportAllotment.objects.create(
            student_name=f"{students[4].first_name} {students[4].last_name}",
            student_id=students[4].roll_number,
            route=route2,
            vehicle=v2,
            boarding_stop='City Mall',
            valid_from=today - datetime.timedelta(days=60),
            is_active=True
        )

        # 17. Alumni
        self.stdout.write('Seeding Alumni profiles and event registrations...')
        al1 = AlumniProfile.objects.create(first_name='Abhishek', last_name='Dubey', email='abhishek.d@alumni.com', phone='+919890989098', batch_year=2023, course='B.Tech', department='Computer Science', current_company='Amazon', designation='SDE I', location='Bangalore', linkedin='https://linkedin.com/in/abhishek', employment_status='employed', is_verified=True)
        al2 = AlumniProfile.objects.create(first_name='Sanjana', last_name='Hegde', email='sanjana.h@alumni.com', phone='+919890989097', batch_year=2024, course='B.Tech', department='Electronics', current_company='Texas Instruments', designation='Hardware Engineer', location='Hyderabad', linkedin='https://linkedin.com/in/sanjana', employment_status='employed', is_verified=True)
        
        a_event = AlumniEvent.objects.create(
            title='Annual Alumni Homecoming 2026',
            description='Join us for a nostalgic weekend reconnecting with classmates, teachers, and current students.',
            event_date=today + datetime.timedelta(days=40),
            venue='Main Campus Ground',
            status='upcoming'
        )
        
        AlumniEventRegistration.objects.create(event=a_event, alumni=al1, attended=False)
        AlumniEventRegistration.objects.create(event=a_event, alumni=al2, attended=False)

        # 18. Notifications
        self.stdout.write('Seeding Notifications...')
        Notification.objects.create(title='Odd Semester Mid-Term Results Declared', message='Mid-term assessment grades are now published. Students can view them on their dashboards under Examination section.', notif_type='info', target='students', is_active=True, created_by='Admin Office')
        Notification.objects.create(title='Academic Fee Due Reminder', message='Students are reminded to clear their semester fees by next Monday to avoid fine charges.', notif_type='warning', target='students', is_active=True, created_by='Finance Dept')
        Notification.objects.create(title='Holiday Announcement - Independence Day', message='College will remain closed on 15th August 2026 on account of Independence Day. Flag hoisting will start at 8:00 AM.', notif_type='success', target='all', is_active=True, created_by='Office of the Principal')
        Notification.objects.create(title='Submission of Monthly Performance Reports', message='All faculty members are requested to upload student attendance and internal assessment marks by today evening.', notif_type='alert', target='faculty', is_active=True, created_by='Dean Academics')
