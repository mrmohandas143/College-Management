# pyrefly: ignore [missing-import]
import datetime
import random
import uuid
# pyrefly: ignore [missing-import]
from django.core.management.base import BaseCommand
# pyrefly: ignore [missing-import]
from django.db import transaction
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from django.contrib.auth.hashers import make_password
# pyrefly: ignore [missing-import]
from faker import Faker

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

# Pre-defined course structures mapped to departments
COURSES_METADATA = {
    "B.E Computer Science": {"duration": 4, "semesters": 8, "intake": 120, "dept": "Computer Science Engineering", "dept_code": "CSE", "short_code": "CS"},
    "B.Tech AI & DS": {"duration": 4, "semesters": 8, "intake": 60, "dept": "Computer Science Engineering", "dept_code": "CSE", "short_code": "AIDS"},
    "B.E Electronics": {"duration": 4, "semesters": 8, "intake": 90, "dept": "Electronics & Communication Engineering", "dept_code": "ECE", "short_code": "EC"},
    "B.Tech Embedded Systems": {"duration": 4, "semesters": 8, "intake": 60, "dept": "Electronics & Communication Engineering", "dept_code": "ECE", "short_code": "ES"},
    "B.E Mechanical": {"duration": 4, "semesters": 8, "intake": 90, "dept": "Mechanical Engineering", "dept_code": "ME", "short_code": "MECH"},
    "B.Tech Automobile": {"duration": 4, "semesters": 8, "intake": 60, "dept": "Mechanical Engineering", "dept_code": "ME", "short_code": "AUTO"},
    "B.Sc Mathematics": {"duration": 3, "semesters": 6, "intake": 60, "dept": "Mathematics", "dept_code": "MATH", "short_code": "BSCM"},
    "M.Sc Mathematics": {"duration": 2, "semesters": 4, "intake": 30, "dept": "Mathematics", "dept_code": "MATH", "short_code": "MSCM"},
    "B.Com": {"duration": 3, "semesters": 6, "intake": 100, "dept": "Commerce", "dept_code": "COMM", "short_code": "BCOM"},
    "M.Com": {"duration": 2, "semesters": 4, "intake": 40, "dept": "Commerce", "dept_code": "COMM", "short_code": "MCOM"},
    "BBA": {"duration": 3, "semesters": 6, "intake": 80, "dept": "Management Studies", "dept_code": "MNGT", "short_code": "BBA"},
    "MBA": {"duration": 2, "semesters": 4, "intake": 120, "dept": "Management Studies", "dept_code": "MNGT", "short_code": "MBA"},
}

class Command(BaseCommand):
    help = 'Seeds database with comprehensive, high-quality test data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Wipes the database before seeding fresh data',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Starting database seeding...'))

        reset = options.get('reset', False)
        if reset:
            self.clear_database()
        else:
            # Re-runability check: check if already seeded to prevent unique/constraint failures
            if Department.objects.exists() or Student.objects.exists() or Faculty.objects.exists():
                self.stdout.write(self.style.WARNING("Database already contains data records. Seeding skipped to avoid conflicts. Use --reset to re-seed."))
                return

        try:
            with transaction.atomic():
                self.seed_data()
            self.stdout.write(self.style.SUCCESS('Successfully seeded all data!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Seeding failed: {str(e)}'))
            import traceback
            traceback.print_exc()

    def clear_database(self):
        self.stdout.write('Purging old records...')
        
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
        
        # User accounts (except superadmin Das, if it exists)
        User.objects.exclude(username='Das').delete()
        CustomRole.objects.all().delete()
        Department.objects.all().delete()
        
        self.stdout.write(self.style.SUCCESS('Purge complete.'))

    def seed_data(self):
        fake = Faker('en_IN') # Using Indian locale for names, addresses, etc.
        today = datetime.date.today()
        
        # Pre-hash passwords to optimize speed
        self.stdout.write('Pre-generating hashed passwords for performance...')
        hashed_admin_pass = make_password('admin123')
        hashed_student_pass = make_password('Student@123')
        hashed_faculty_pass = make_password('Faculty@123')
        
        # 1. Seed Departments
        self.stdout.write('Seeding Departments...')
        depts_def = [
            ("Computer Science Engineering", "CSE", "Focuses on advanced software engineering, AI, and computing systems."),
            ("Electronics & Communication Engineering", "ECE", "Focuses on signal processing, VLSI design, and embedded communication systems."),
            ("Mechanical Engineering", "ME", "Focuses on thermodynamic design, automation, robotics, and fluid mechanics."),
            ("Mathematics", "MATH", "Focuses on pure & applied mathematics, statistical modeling, and algorithms."),
            ("Commerce", "COMM", "Focuses on business finance, accounting, taxation, and market analysis."),
            ("Management Studies", "MNGT", "Focuses on corporate leadership, marketing strategy, operations, and MBA courses.")
        ]
        
        departments = {}
        for name, code, desc in depts_def:
            established_year = random.randint(1995, 2015)
            dept = Department.objects.create(
                name=name,
                code=code,
                description=f"{desc} Established in {established_year}. Contact: {code.lower()}-office@collegems.edu.in",
                head="" # Will fill this later when HOD faculty is created
            )
            departments[code] = dept

        # 2. Seed Admin Users
        self.stdout.write('Seeding Admin Accounts...')
        # Super Admin
        User.objects.create_user(
            username='admin',
            password='admin123',
            email='admin@collegems.edu.in',
            role='super_admin',
            is_staff=True,
            is_superuser=True,
            full_name='Super Admin',
            phone='+919988776655'
        )
        # Assistant Admins
        for idx in range(1, 3):
            User.objects.create_user(
                username=f'assistant_admin{idx}',
                password='admin123',
                email=f'assistant_admin{idx}@collegems.edu.in',
                role='admin',
                is_staff=True,
                is_superuser=False,
                full_name=f'Assistant Admin {idx}',
                phone=f'+9199887766{idx}{idx}'
            )

        # 3. Seed Faculty Members (60)
        self.stdout.write('Seeding Faculty & HR Employee Records...')
        faculty_dist = {
            "CSE": 12,
            "ECE": 10,
            "ME": 10,
            "MATH": 8,
            "COMM": 10,
            "MNGT": 10
        }
        
        designations = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer']
        qualifications = ['Ph.D.', 'M.Tech.', 'M.Sc.', 'M.Com.', 'MBA']
        
        faculties = []
        faculty_users = []
        employees = []
        payroll_configs = []
        payrolls = []
        employee_attendances = []
        employee_leaves = []
        
        faculty_id_counter = 1
        
        for dept_code, count in faculty_dist.items():
            dept_obj = departments[dept_code]
            
            # Create HOD first for each department
            hod_gender = random.choice(['male', 'female'])
            hod_first = fake.first_name_male() if hod_gender == 'male' else fake.first_name_female()
            hod_last = fake.last_name()
            hod_email = f"{hod_first.lower()}.{hod_last.lower()}@collegems.edu.in"
            
            # Prevent duplicate emails
            while Faculty.objects.filter(email=hod_email).exists() or User.objects.filter(email=hod_email).exists():
                hod_first = fake.first_name()
                hod_email = f"{hod_first.lower()}.{random.randint(10,99)}@{fake.free_email_domain()}"

            hod = Faculty.objects.create(
                first_name=hod_first,
                last_name=hod_last,
                email=hod_email,
                phone=fake.phone_number()[:15],
                department=dept_obj.name,
                course=random.choice([c for c, m in COURSES_METADATA.items() if m['dept_code'] == dept_code]),
                designation='HOD',
                qualification='Ph.D.',
                experience=random.randint(15, 25),
                status='active'
            )
            # Update department with HOD head name
            dept_obj.head = f"Dr. {hod_first} {hod_last}"
            dept_obj.save()
            faculties.append(hod)
            
            # Create User for HOD
            hod_username = f"hod_{dept_code.lower()}"
            hod_user = User(
                username=hod_username,
                password=hashed_faculty_pass,
                email=hod_email,
                role='faculty',
                full_name=f"Dr. {hod_first} {hod_last}",
                phone=hod.phone,
                department=dept_obj.name
            )
            faculty_users.append(hod_user)
            
            # Create Employee for HOD
            hod_joining = today - datetime.timedelta(days=random.randint(2000, 4000))
            hod_emp = Employee(
                employee_id=f"EMP{faculty_id_counter:03d}",
                first_name=hod_first,
                last_name=hod_last,
                email=hod_email,
                phone=hod.phone,
                gender=hod_gender,
                date_of_birth=today - datetime.timedelta(days=random.randint(15000, 22000)),
                address=fake.address().replace('\n', ', '),
                department=dept_obj,
                designation='HOD',
                employment_type='full_time',
                date_of_joining=hod_joining,
                basic_salary=110000.00,
                status='active',
                faculty=hod
            )
            employees.append(hod_emp)
            faculty_id_counter += 1
            
            # Other faculties in department
            for _ in range(count - 1):
                f_gender = random.choice(['male', 'female'])
                f_first = fake.first_name_male() if f_gender == 'male' else fake.first_name_female()
                f_last = fake.last_name()
                f_email = f"{f_first.lower()}.{f_last.lower()}@collegems.edu.in"
                
                while Faculty.objects.filter(email=f_email).exists() or User.objects.filter(email=f_email).exists():
                    f_first = fake.first_name()
                    f_email = f"{f_first.lower()}.{random.randint(10,99)}@{fake.free_email_domain()}"

                des = random.choice(designations)
                exp = random.randint(1, 14)
                
                fac = Faculty.objects.create(
                    first_name=f_first,
                    last_name=f_last,
                    email=f_email,
                    phone=fake.phone_number()[:15],
                    department=dept_obj.name,
                    course=random.choice([c for c, m in COURSES_METADATA.items() if m['dept_code'] == dept_code]),
                    designation=des,
                    qualification=random.choice(qualifications),
                    experience=exp,
                    status='active'
                )
                faculties.append(fac)
                
                # Distribute historical hiring dates over last 24 months
                hiring_month = random.randint(1, 24)
                created_date = datetime.datetime.now() - datetime.timedelta(days=hiring_month * 30)
                Faculty.objects.filter(id=fac.id).update(created_at=created_date)
                
                # Create User for Faculty
                fac_username = f"faculty_{faculty_id_counter}"
                fac_user = User(
                    username=fac_username,
                    password=hashed_faculty_pass,
                    email=f_email,
                    role='faculty',
                    full_name=f"{f_first} {f_last}",
                    phone=fac.phone,
                    department=dept_obj.name
                )
                faculty_users.append(fac_user)
                
                # Employee
                emp_joining = today - datetime.timedelta(days=random.randint(100, 1800))
                basic = 40000.00 + (exp * 3000.00)
                emp = Employee(
                    employee_id=f"EMP{faculty_id_counter:03d}",
                    first_name=f_first,
                    last_name=f_last,
                    email=f_email,
                    phone=fac.phone,
                    gender=f_gender,
                    date_of_birth=today - datetime.timedelta(days=random.randint(9000, 14000)),
                    address=fake.address().replace('\n', ', '),
                    department=dept_obj,
                    designation=des,
                    employment_type='full_time',
                    date_of_joining=emp_joining,
                    basic_salary=basic,
                    status='active',
                    faculty=fac
                )
                employees.append(emp)
                faculty_id_counter += 1

        # Bulk create Users and Employees
        User.objects.bulk_create(faculty_users)
        Employee.objects.bulk_create(employees)
        
        # Reload employees to get their IDs and link config & payroll
        all_employees = list(Employee.objects.all())
        for emp in all_employees:
            # Config
            pc = PayrollConfig(
                employee=emp,
                hra_percent=20,
                ta_percent=10,
                pf_percent=12,
                tax_percent=10,
                other_allowances=2000.00,
                other_deductions=1000.00
            )
            payroll_configs.append(pc)
            
            # Payroll for last 3 months
            for month_offset in [1, 2, 3]:
                p_date = today - datetime.timedelta(days=month_offset * 30)
                basic_val = float(emp.basic_salary)
                gross = basic_val * 1.30
                pf = basic_val * 0.12
                tax = gross * 0.10
                ded = pf + tax + 1000.00
                net = gross - ded
                
                pr = Payroll(
                    employee=emp,
                    month=p_date.month,
                    year=p_date.year,
                    working_days=26,
                    present_days=25,
                    absent_days=1,
                    basic_salary=basic_val,
                    hra=basic_val * 0.20,
                    ta=basic_val * 0.10,
                    other_allowances=2000.00,
                    gross_salary=gross,
                    pf_deduction=pf,
                    tax_deduction=tax,
                    other_deductions=1000.00,
                    total_deductions=ded,
                    net_salary=net,
                    status='paid',
                    paid_on=p_date
                )
                payrolls.append(pr)
                
            # Seed Faculty Employee Attendance (last 10 days)
            for d in range(1, 11):
                att_date = today - datetime.timedelta(days=d)
                if att_date.weekday() < 5:
                    status = 'present' if random.random() > 0.05 else 'absent'
                    employee_attendances.append(EmployeeAttendance(
                        employee=emp,
                        date=att_date,
                        status=status,
                        check_in=datetime.time(9, random.randint(0, 15)) if status == 'present' else None,
                        check_out=datetime.time(17, random.randint(0, 15)) if status == 'present' else None
                    ))
            
            # Seed Leave Requests (2 per employee)
            employee_leaves.append(EmployeeLeave(
                employee=emp,
                leave_type='sick',
                from_date=today - datetime.timedelta(days=20),
                to_date=today - datetime.timedelta(days=19),
                reason='Viral Fever',
                status='approved',
                remarks='Approved.'
            ))
            employee_leaves.append(EmployeeLeave(
                employee=emp,
                leave_type='casual',
                from_date=today + datetime.timedelta(days=10),
                to_date=today + datetime.timedelta(days=11),
                reason='Personal Work',
                status='pending'
            ))

        PayrollConfig.objects.bulk_create(payroll_configs)
        Payroll.objects.bulk_create(payrolls)
        EmployeeAttendance.objects.bulk_create(employee_attendances)
        EmployeeLeave.objects.bulk_create(employee_leaves)
        
        self.stdout.write(f'Created {Faculty.objects.count()} Faculty and synced Employee payroll/attendance logs.')

        # 4. Seed Course Subjects (6 Theory, 2 Practical per course/semester)
        self.stdout.write('Seeding Subjects...')
        subjects_pool = []
        subject_names_theory = [
            "Advanced Programming", "Data Structures", "Database Management Systems", "Software Engineering", 
            "Computer Architecture", "Operating Systems", "Discrete Mathematics", "Digital System Design", 
            "Artificial Intelligence", "Machine Learning", "Microprocessors", "Signal Processing", 
            "Thermodynamics", "Kinematics of Machinery", "Fluid Mechanics", "Calculus & Linear Algebra", 
            "Real Analysis", "Numerical Methods", "Abstract Algebra", "Complex Analysis",
            "Financial Accounting", "Corporate Finance", "Business Laws", "Marketing Management",
            "Human Resource Management", "Strategic Management", "Organizational Behavior", "Macroeconomics"
        ]
        subject_names_practical = [
            "DSA Lab", "DBMS Lab", "Operating Systems Lab", "Networks Lab", "VLSI Design Lab", 
            "Microcontroller Lab", "Thermal Engineering Lab", "AutoCAD Practical", "Physics Lab"
        ]

        subject_counter = 100
        for course_name, meta in COURSES_METADATA.items():
            for sem in range(1, meta['semesters'] + 1):
                # 6 Theory
                for i in range(1, 7):
                    sub_name = f"{random.choice(subject_names_theory)} {i}"
                    sub_code = f"{meta['short_code']}{sem}{i:02d}"
                    
                    # Pick random faculty from same department
                    dept_faculties = [f for f in faculties if f.department == meta['dept']]
                    fac_name = f"{random.choice(dept_faculties)}" if dept_faculties else ""
                    
                    sub = Subject(
                        name=sub_name,
                        code=sub_code,
                        course=course_name,
                        department=meta['dept'],
                        semester=sem,
                        credits=random.choice([3, 4]),
                        subject_type='theory',
                        faculty_name=fac_name,
                        is_active=True
                    )
                    subjects_pool.append(sub)
                    subject_counter += 1
                # 2 Practical
                for i in range(1, 3):
                    sub_name = f"{random.choice(subject_names_practical)} {i}"
                    sub_code = f"{meta['short_code']}{sem}P{i:02d}"
                    dept_faculties = [f for f in faculties if f.department == meta['dept']]
                    fac_name = f"{random.choice(dept_faculties)}" if dept_faculties else ""
                    
                    sub = Subject(
                        name=sub_name,
                        code=sub_code,
                        course=course_name,
                        department=meta['dept'],
                        semester=sem,
                        credits=2,
                        subject_type='practical',
                        faculty_name=fac_name,
                        is_active=True
                    )
                    subjects_pool.append(sub)
                    subject_counter += 1

        Subject.objects.bulk_create(subjects_pool)
        self.stdout.write(f'Created {Subject.objects.count()} Subjects across all courses & semesters.')

        # 5. Seed Fee Structures
        self.stdout.write('Seeding Fee Structures for all Semesters and Years...')
        fee_structures = []
        academic_years = ['2024-25', '2025-26', '2026-27']
        
        # Course Tuition, Exam, Lab, Library, Sports fees
        for course_name, meta in COURSES_METADATA.items():
            for sem in range(1, meta['semesters'] + 1):
                for ac_yr in academic_years:
                    # Tuition
                    tuition_amt = random.randint(25000, 80000)
                    fee_structures.append(FeeStructure(
                        name=f"Tuition Fee - {course_name} Sem {sem}",
                        fee_type='tuition',
                        amount=tuition_amt,
                        course=course_name,
                        department=meta['dept'],
                        semester=sem,
                        academic_year=ac_yr,
                        is_active=True,
                        description=f"Standard tuition fee for {course_name} semester {sem} in academic year {ac_yr}."
                    ))
                    # Exam
                    fee_structures.append(FeeStructure(
                        name=f"Examination Fee - {course_name} Sem {sem}",
                        fee_type='exam',
                        amount=random.randint(1500, 5000),
                        course=course_name,
                        department=meta['dept'],
                        semester=sem,
                        academic_year=ac_yr,
                        is_active=True,
                        description=f"Semester exam fees for {course_name} semester {sem} in academic year {ac_yr}."
                    ))
                    # Library
                    fee_structures.append(FeeStructure(
                        name=f"Library Fee - {course_name} Sem {sem}",
                        fee_type='library',
                        amount=random.randint(1000, 3000),
                        course=course_name,
                        department=meta['dept'],
                        semester=sem,
                        academic_year=ac_yr,
                        is_active=True,
                        description=f"Library access and digital subscription charges."
                    ))
                    # Laboratory
                    if meta['dept_code'] in ['CSE', 'ECE', 'ME', 'MATH']:
                        fee_structures.append(FeeStructure(
                            name=f"Laboratory Fee - {course_name} Sem {sem}",
                            fee_type='lab',
                            amount=random.randint(2000, 10000),
                            course=course_name,
                            department=meta['dept'],
                            semester=sem,
                            academic_year=ac_yr,
                            is_active=True,
                            description=f"Practical lab usage and equipment maintenance fee."
                        ))
                    # Sports
                    fee_structures.append(FeeStructure(
                        name=f"Sports Fee - {course_name} Sem {sem}",
                        fee_type='sports',
                        amount=random.randint(500, 3000),
                        course=course_name,
                        department=meta['dept'],
                        semester=sem,
                        academic_year=ac_yr,
                        is_active=True,
                        description=f"Physical education, athletics, and sports club charges."
                    ))

        # Create generic Hostel and Transport fee structures
        for ac_yr in academic_years:
            fee_structures.append(FeeStructure(
                name="Hostel Fee",
                fee_type='hostel',
                amount=45000.00,
                academic_year=ac_yr,
                is_active=True,
                description="General hostel boarding & lodging charges."
            ))
            fee_structures.append(FeeStructure(
                name="Transport Fee",
                fee_type='transport',
                amount=15000.00,
                academic_year=ac_yr,
                is_active=True,
                description="College bus transport subscription charges."
            ))

        FeeStructure.objects.bulk_create(fee_structures)
        self.stdout.write(f'Created {FeeStructure.objects.count()} Fee Structures.')

        # Reload FeeStructures to map them easily
        structures_by_key = {}
        for fs in FeeStructure.objects.filter(is_active=True):
            key = (fs.course, fs.semester, fs.academic_year, fs.fee_type)
            structures_by_key[key] = fs

        # 6. Seed Students (500)
        self.stdout.write('Seeding Students & linked User/Parent Accounts...')
        student_dist = {
            "CSE": 120,
            "ECE": 90,
            "ME": 90,
            "MATH": 60,
            "COMM": 70,
            "MNGT": 70
        }
        
        students_pool = []
        student_users_pool = []
        parent_users_pool = []
        
        student_counter = 1
        
        for dept_code, total_count in student_dist.items():
            dept_obj = departments[dept_code]
            dept_courses = [c for c, m in COURSES_METADATA.items() if m['dept_code'] == dept_code]
            
            # Distribute students evenly among courses in department
            students_per_course = total_count // len(dept_courses)
            
            for course_name in dept_courses:
                meta = COURSES_METADATA[course_name]
                
                for idx_course in range(students_per_course):
                    # Randomize gender
                    gender = random.choice(['male', 'female'])
                    first_name = fake.first_name_male() if gender == 'male' else fake.first_name_female()
                    last_name = fake.last_name()
                    email = f"std_{student_counter:04d}@{fake.free_email_domain()}"
                    
                    # Randomize year and semester
                    # UG (B.E/B.Tech/B.Sc/B.Com/BBA): 1-4 years
                    # PG (M.Sc/M.Com/MBA): 1-2 years
                    stud_year = random.randint(1, meta['duration'])
                    stud_sem = random.choice([stud_year * 2 - 1, stud_year * 2])
                    section = random.choice(['A', 'B', 'C'])
                    
                    admission_year = today.year - stud_year + 1
                    admission_date = datetime.date(admission_year, 8, 1)
                    
                    roll = f"{meta['dept_code']}{admission_year % 100}{student_counter:03d}"
                    cgpa = round(random.uniform(5.0, 10.0), 2)
                    attendance = round(random.uniform(55.0, 100.0), 2)
                    
                    status = 'active' if random.random() > 0.05 else 'inactive'
                    
                    stud = Student(
                        first_name=first_name,
                        last_name=last_name,
                        email=email,
                        phone=fake.phone_number()[:15],
                        gender=gender,
                        date_of_birth=today - datetime.timedelta(days=random.randint(6200, 8500)), # age 17-23
                        address=fake.address().replace('\n', ', '),
                        course=course_name,
                        department=dept_obj.name,
                        year=stud_year,
                        roll_number=roll,
                        register_number=roll,
                        status=status,
                        cgpa=cgpa,
                        attendance_percentage=attendance
                    )
                    students_pool.append(stud)
                    
                    student_counter += 1

        # Bulk create Student objects first
        Student.objects.bulk_create(students_pool)
        all_students = list(Student.objects.all())
        
        # Spread student admission created_at logs over past 24 months
        self.stdout.write('Spreading Student Admissions over last 24 months...')
        for index, stud in enumerate(all_students):
            months_ago = random.randint(0, 23)
            created_date = datetime.datetime.now() - datetime.timedelta(days=months_ago * 30)
            Student.objects.filter(id=stud.id).update(created_at=created_date)
            
            # Prepare student user account
            stud_user = User(
                username=stud.roll_number,
                password=hashed_student_pass,
                email=stud.email,
                role='student',
                linked_student=stud,
                full_name=f"{stud.first_name} {stud.last_name}",
                phone=stud.phone,
                department=stud.department
            )
            student_users_pool.append(stud_user)
            
            # Prepare parent account
            parent_name = f"Mr. {stud.last_name}"
            parent_contact = fake.phone_number()[:15]
            parent_user = User(
                username=f"parent_{stud.roll_number}",
                password=hashed_student_pass,
                email=f"parent.{stud.roll_number.lower()}@gmail.com",
                role='parent',
                linked_student=stud,
                full_name=parent_name,
                phone=parent_contact
            )
            parent_users_pool.append(parent_user)

        # Bulk create User accounts
        User.objects.bulk_create(student_users_pool)
        User.objects.bulk_create(parent_users_pool)
        self.stdout.write(f'Created {len(all_students)} Students & user/parent accounts.')

        # 7. Seed Scholarships (80 eligible students)
        self.stdout.write('Selecting 80 eligible students for scholarships...')
        scholarship_students = random.sample(all_students, 80)
        scholarship_by_student_id = {}
        
        scholarship_types = ['Merit Scholarship', 'Sports Scholarship', 'Minority Scholarship', 'Government Scholarship', 'Financial Aid']
        for stud in scholarship_students:
            s_type = random.choice(scholarship_types)
            s_amt = float(random.choice([5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000]))
            scholarship_by_student_id[stud.id] = {
                "type": s_type,
                "amount": s_amt
            }

        # 8. Seed Student Fee Records (3 to 8 per student; target 2500+)
        self.stdout.write('Generating Student Fee Records (including historical)...')
        fee_records = []
        
        status_choices = ['paid', 'pending', 'overdue', 'partial']
        status_weights = [0.60, 0.20, 0.10, 0.10]
        payment_modes = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash']
        
        for stud in all_students:
            # Generate fees for all completed semesters and the current semester
            current_sem = stud.year * 2 if stud.status == 'active' else random.choice([1, 2])
            
            # Map semester offset back to academic years
            # Sem 1/2 -> 2024-25, Sem 3/4 -> 2025-26, Sem 5/6 -> 2026-27
            for sem in range(1, current_sem + 1):
                if sem in [1, 2]:
                    ac_yr = '2024-25'
                elif sem in [3, 4]:
                    ac_yr = '2025-26'
                else:
                    ac_yr = '2026-27'
                
                # Check for tuition, exam, library, and sports fees
                for ftype in ['tuition', 'exam', 'library', 'sports']:
                    fs_key = (stud.course, sem, ac_yr, ftype)
                    if fs_key not in structures_by_key:
                        continue
                    
                    fs = structures_by_key[fs_key]
                    
                    # 100% Paid for historical completed semesters, random for current semester
                    is_historical = sem < current_sem
                    if is_historical:
                        status = 'paid'
                    else:
                        status = random.choices(status_choices, weights=status_weights, k=1)[0]
                    
                    # Check if student has scholarship for tuition
                    sch_amt = 0.0
                    sch_type = ""
                    if ftype == 'tuition' and stud.id in scholarship_by_student_id:
                        sch = scholarship_by_student_id[stud.id]
                        sch_amt = sch['amount']
                        sch_type = sch['type']

                    # Generate realistic amount/discount
                    raw_amount = float(fs.amount)
                    disc_amt = 0.0
                    fine_amt = 0.0
                    
                    # Give casual discount for some paid/historical fees
                    if random.random() > 0.85:
                        disc_amt = float(random.choice([500, 1000, 1500]))
                        
                    # Charge fine for overdue records
                    if status == 'overdue':
                        fine_amt = float(random.randint(100, 500))
                        
                    # Calculate net_amount
                    net_amt = raw_amount - sch_amt - disc_amt + fine_amt
                    if net_amt < 0:
                        net_amt = 0.0

                    # Simulate partial status mapping
                    status_in_db = status
                    remarks = "Academic Fee Record."
                    
                    if status == 'partial':
                        # Database only supports paid/pending/overdue
                        status_in_db = 'pending'
                        paid_portion = round(net_amt * random.uniform(0.3, 0.7), 2)
                        remaining = net_amt - paid_portion
                        remarks = f"Partial Payment: Paid ₹{paid_portion} of ₹{net_amt}. Balance remaining: ₹{remaining}."
                        # Remaining amount is what student still owes
                        net_amt = remaining 
                    elif sch_amt > 0:
                        remarks = f"Scholarship applied: {sch_type} (₹{sch_amt})."

                    due_d = today - datetime.timedelta(days=random.randint(30, 300)) if is_historical else today + datetime.timedelta(days=random.randint(-15, 45))
                    
                    paid_d = None
                    pay_mode = ""
                    txn_id = ""
                    
                    if status_in_db == 'paid':
                        paid_d = due_d - datetime.timedelta(days=random.randint(0, 10))
                        pay_mode = random.choice(payment_modes)
                        txn_id = f"TXN{random.randint(10000000, 99999999)}"

                    fee = Fee(
                        student=stud,
                        fee_structure=fs,
                        amount=raw_amount,
                        net_amount=net_amt,
                        fee_type=ftype,
                        semester=sem,
                        academic_year=ac_yr,
                        due_date=due_d,
                        paid_date=paid_d,
                        status=status_in_db,
                        payment_mode=pay_mode,
                        transaction_id=txn_id,
                        description=f"{remarks} Discount: ₹{disc_amt} | Scholarship: ₹{sch_amt} | Fine: ₹{fine_amt}"
                    )
                    fee_records.append(fee)

        # Bulk create all Fee Records
        Fee.objects.bulk_create(fee_records)
        self.stdout.write(f'Created {Fee.objects.count()} Student Fee Records (with status distribution and pre-hashing).')

        # 9. Seed Student Attendance (10000+ records)
        self.stdout.write('Seeding Student Attendance records (over past 25 class days)...')
        attendance_sessions = []
        
        # Hold classes for last 25 days, skipping weekends
        class_days = []
        day_offset = 0
        while len(class_days) < 25:
            day_offset += 1
            check_date = today - datetime.timedelta(days=day_offset)
            if check_date.weekday() < 5: # Monday to Friday
                class_days.append(check_date)

        # Map subjects to course/semester
        subjects_by_course_sem = {}
        for sub in Subject.objects.all():
            key = (sub.course, sub.semester)
            if key not in subjects_by_course_sem:
                subjects_by_course_sem[key] = []
            subjects_by_course_sem[key].append(sub)

        # Group students by (course, semester)
        students_by_course_sem = {}
        for stud in all_students:
            # Assume active semester is current_sem based on year
            # Year 1 -> Sem 1, Year 2 -> Sem 3, Year 3 -> Sem 5, Year 4 -> Sem 7
            current_sem = stud.year * 2 - 1
            key = (stud.course, current_sem)
            if key not in students_by_course_sem:
                students_by_course_sem[key] = []
            students_by_course_sem[key].append(stud)

        # Create Attendance Sessions (only for active semesters of each course)
        for day in class_days:
            for course_name, meta in COURSES_METADATA.items():
                active_sems = set()
                for stud in all_students:
                    if stud.course == course_name and stud.status == 'active':
                        active_sems.add(stud.year * 2 - 1)
                
                for sem in active_sems:
                    dept_subs = subjects_by_course_sem.get((course_name, sem), [])
                    if not dept_subs:
                        continue
                    # Pick 1 random subject for this session
                    sub = random.choice(dept_subs)
                    attendance_sessions.append(AttendanceSession(
                        date=day,
                        course=course_name,
                        department=meta['dept'],
                        subject=sub.name,
                        faculty_name=sub.faculty_name,
                        period=sem
                    ))

        AttendanceSession.objects.bulk_create(attendance_sessions)
        all_sessions = list(AttendanceSession.objects.all())
        self.stdout.write(f'Created {len(all_sessions)} Attendance Sessions.')

        # Designated low attendance students (8% of students) to test alerts
        low_att_students = set(random.sample(all_students, int(len(all_students) * 0.08)))
        
        student_attendances = []
        for sess in all_sessions:
            # Session course and subject define which students are enrolled.
            # Find subject to know its semester
            sub_objs = Subject.objects.filter(name=sess.subject, course=sess.course)
            if not sub_objs.exists():
                continue
            sem = sub_objs.first().semester
            
            sess_students = students_by_course_sem.get((sess.course, sem), [])
            for stud in sess_students:
                # Probability of presence: 60% for low attendance students, 92% for others
                prob = 0.60 if stud in low_att_students else 0.92
                if random.random() <= prob:
                    status = 'present'
                else:
                    status = random.choices(['absent', 'late', 'excused'], weights=[0.70, 0.20, 0.10], k=1)[0]
                
                student_attendances.append(StudentAttendance(
                    session=sess,
                    student=stud,
                    status=status,
                    remarks="Daily check-in" if status != 'present' else ""
                ))

        # Bulk create Student Attendance
        StudentAttendance.objects.bulk_create(student_attendances)
        self.stdout.write(f'Created {StudentAttendance.objects.count()} Student Attendance Records.')

        # 10. Seed Exams & Exam Results (8000+ Marks records)
        self.stdout.write('Seeding Exams and Exam Results (Internal & External)...')
        exams = []
        
        # Pre-assign students performance tiers
        top_performers = set(random.sample(all_students, int(len(all_students) * 0.10)))
        remaining_students = [s for s in all_students if s not in top_performers]
        failed_students = set(random.sample(remaining_students, int(len(all_students) * 0.10)))
        
        # Create Exams for each subject in current semester
        for course_name, meta in COURSES_METADATA.items():
            for sem in range(1, meta['semesters'] + 1):
                dept_subs = subjects_by_course_sem.get((course_name, sem), [])
                for sub in dept_subs:
                    # Internal Exam
                    exams.append(Exam(
                        name=f"First Mid-Term Internal - {sub.name}",
                        exam_type='internal',
                        course=course_name,
                        department=meta['dept'],
                        semester=sem,
                        subject=sub.name,
                        subject_code=sub.code,
                        exam_date=today - datetime.timedelta(days=20),
                        start_time=datetime.time(10, 0),
                        end_time=datetime.time(11, 30),
                        room='Exam Hall A',
                        max_marks=40,
                        pass_marks=16,
                        status='completed',
                        academic_year='2026-27'
                    ))
                    # External Exam
                    exams.append(Exam(
                        name=f"Final Semester Theory Exam - {sub.name}",
                        exam_type='external',
                        course=course_name,
                        department=meta['dept'],
                        semester=sem,
                        subject=sub.name,
                        subject_code=sub.code,
                        exam_date=today - datetime.timedelta(days=5),
                        start_time=datetime.time(9, 30),
                        end_time=datetime.time(12, 30),
                        room='Block C Hall',
                        max_marks=60,
                        pass_marks=24,
                        status='completed',
                        academic_year='2026-27'
                    ))

        Exam.objects.bulk_create(exams)
        all_exams = list(Exam.objects.all())
        self.stdout.write(f'Created {len(all_exams)} Exam Schedules.')

        exam_results = []
        # Create ExamResult records for students registered in the course-semester
        for exam in all_exams:
            # Identify students in this course/semester
            # Note: Active student's semester is (year * 2 - 1)
            sess_students = students_by_course_sem.get((exam.course, exam.semester), [])
            for stud in sess_students:
                # Grade logic based on tier
                if stud in top_performers:
                    obtained = round(float(exam.max_marks) * random.uniform(0.85, 1.0), 2)
                elif stud in failed_students:
                    obtained = round(float(exam.max_marks) * random.uniform(0.20, 0.38), 2)
                else:
                    obtained = round(float(exam.max_marks) * random.uniform(0.40, 0.85), 2)
                
                pct = (obtained / exam.max_marks) * 100
                is_pass = obtained >= exam.pass_marks
                
                if pct >= 90:   grade = 'O'
                elif pct >= 80: grade = 'A+'
                elif pct >= 70: grade = 'A'
                elif pct >= 60: grade = 'B+'
                elif pct >= 50: grade = 'B'
                elif pct >= 40: grade = 'C'
                else:           grade = 'F'
                
                exam_results.append(ExamResult(
                    exam=exam,
                    student=stud,
                    marks_obtained=obtained,
                    grade=grade,
                    is_pass=is_pass,
                    remarks="Regular appearance" if is_pass else "Needs improvement",
                    entered_by="Academic Office"
                ))

        # Bulk create all ExamResults
        ExamResult.objects.bulk_create(exam_results)
        self.stdout.write(f'Created {ExamResult.objects.count()} Student Marks Records (top/average/failed distribution).')

        # 11. Seed Notifications (100)
        self.stdout.write('Seeding 100 Notifications...')
        notif_types = ['info', 'warning', 'success', 'alert']
        notif_targets = ['all', 'students', 'faculty', 'parents']
        
        notif_pool = []
        for i in range(1, 101):
            n_type = random.choice(notif_types)
            n_target = random.choice(notif_targets)
            
            notif_pool.append(Notification(
                title=f"{fake.sentence(nb_words=4).strip('.')} - Alert #{i}",
                message=f"This is a system broadcast notification to {n_target} regarding {fake.bs()}. Please check your portal updates.",
                notif_type=n_type,
                target=n_target,
                is_active=True,
                created_by=random.choice(["Admin Office", "Dean Academics", "Finance Controller", "Librarian"])
            ))
            
        Notification.objects.bulk_create(notif_pool)
        self.stdout.write('Created 100 system notifications.')

        # 12. Seed Timetable Entries
        self.stdout.write('Seeding Timetable Entries...')
        days_of_week = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        timetable_entries = []
        for course_name, meta in COURSES_METADATA.items():
            for sem in [1, 3]: # Seed for 1st and 3rd semesters mainly to keep DB light but populated
                dept_subs = subjects_by_course_sem.get((course_name, sem), [])
                if len(dept_subs) >= 4:
                    for day in days_of_week:
                        for period in [1, 2, 3, 4]:
                            sub = dept_subs[period % len(dept_subs)]
                            timetable_entries.append(TimetableEntry(
                                course=course_name,
                                department=meta['dept'],
                                semester=sem,
                                day=day,
                                period=period,
                                start_time=datetime.time(9 + period, 0),
                                end_time=datetime.time(10 + period, 0),
                                subject=sub.name,
                                subject_code=sub.code,
                                faculty_name=sub.faculty_name,
                                room=f"Block B Room {100 + period + sem}",
                                academic_year='2026-27'
                            ))
        TimetableEntry.objects.bulk_create(timetable_entries)

        # 13. Seed Hostel Block, Rooms and Allotments
        self.stdout.write('Seeding Hostel Blocks and room allotments...')
        boys_block = HostelBlock.objects.create(name='Boys Hostel Block A', gender='male', warden='Dr. Vikram Singh', capacity=200)
        girls_block = HostelBlock.objects.create(name='Girls Hostel Block B', gender='female', warden='Dr. Sunita Rao', capacity=150)
        
        rooms = []
        # Create 20 rooms in boys block
        for r in range(101, 121):
            rooms.append(Room(block=boys_block, room_number=str(r), room_type='double', capacity=2, occupied=0, status='available', floor=1))
        # Create 20 rooms in girls block
        for r in range(101, 121):
            rooms.append(Room(block=girls_block, room_number=str(r), room_type='single', capacity=1, occupied=0, status='available', floor=1))
            
        Room.objects.bulk_create(rooms)
        
        # Allot hostel rooms to 40 random students (20 boys, 20 girls)
        boys_to_allot = [s for s in all_students if s.gender == 'male'][:20]
        girls_to_allot = [s for s in all_students if s.gender == 'female'][:20]
        
        hostel_allotments = []
        db_rooms = list(Room.objects.all())
        
        # Allot Boys (Double sharing)
        boys_rooms = [rm for rm in db_rooms if rm.block == boys_block]
        for idx, boy in enumerate(boys_to_allot):
            room = boys_rooms[idx // 2]
            allot = HostelAllotment.objects.create(
                room=room,
                student_name=f"{boy.first_name} {boy.last_name}",
                student_id=boy.roll_number,
                contact=boy.phone,
                allotment_date=today - datetime.timedelta(days=120),
                status='active'
            )
            hostel_allotments.append(allot)
            room.occupied += 1
            if room.occupied >= room.capacity:
                room.status = 'occupied'
            room.save()

        # Allot Girls (Single rooms)
        girls_rooms = [rm for rm in db_rooms if rm.block == girls_block]
        for idx, girl in enumerate(girls_to_allot):
            room = girls_rooms[idx]
            allot = HostelAllotment.objects.create(
                room=room,
                student_name=f"{girl.first_name} {girl.last_name}",
                student_id=girl.roll_number,
                contact=girl.phone,
                allotment_date=today - datetime.timedelta(days=120),
                status='active'
            )
            hostel_allotments.append(allot)
            room.occupied += 1
            room.status = 'occupied'
            room.save()
            
        # Seed some Hostel complaints, leaves, and visitors
        for allot in hostel_allotments[:5]:
            HostelComplaint.objects.create(
                room=allot.room,
                student_name=allot.student_name,
                complaint=random.choice(["Water filter not working", "Study table light is broken", "Ceiling fan speed regulator broken"]),
                status='pending'
            )
            HostelLeave.objects.create(
                student_name=allot.student_name,
                student_id=allot.student_id,
                room=allot.room,
                from_date=today + datetime.timedelta(days=5),
                to_date=today + datetime.timedelta(days=7),
                reason="Going home for weekend",
                status="approved"
            )
            Visitor.objects.create(
                student_name=allot.student_name,
                student_id=allot.student_id,
                visitor_name=fake.name(),
                relation=random.choice(["Father", "Mother", "Guardian"]),
                contact=fake.phone_number()[:15],
                purpose="Personal visit",
                check_in=timezone.now() - datetime.timedelta(hours=2),
                check_out=timezone.now()
            )
            HostelAttendance.objects.create(
                allotment=allot,
                date=today - datetime.timedelta(days=1),
                present=True
            )
            # Hostel Fee
            HostelFee.objects.create(
                allotment=allot,
                month="July 2026",
                amount=5000.00,
                due_date=today + datetime.timedelta(days=10),
                status="pending"
            )

        # 14. Seed Library Categories & Books
        self.stdout.write('Seeding Library setup and books...')
        lib_cats = []
        for cat_name in ["Computer Science", "Electronics", "Mechanical Engineering", "Mathematics", "Commerce & Finance", "Management"]:
            lib_cats.append(BookCategory.objects.create(name=cat_name))
            
        books = []
        for cat in lib_cats:
            for i in range(1, 6): # 5 books per category
                books.append(Book(
                    title=f"Core Concepts in {cat.name} Vol. {i}",
                    author=fake.name(),
                    isbn=f"978{random.randint(1000000000, 9999999999)}",
                    category=cat,
                    publisher=fake.company(),
                    edition=f"{random.randint(1,5)}th",
                    total_copies=5,
                    available_copies=5,
                    rack_number=f"Rack-{random.choice(['A','B','C','D'])}-{random.randint(1,10)}"
                ))
        Book.objects.bulk_create(books)
        
        # Issue books to 30 random students
        db_books = list(Book.objects.all())
        for stud in all_students[:30]:
            bk = random.choice(db_books)
            if bk.available_copies > 0:
                BookIssue.objects.create(
                    book=bk,
                    member_name=f"{stud.first_name} {stud.last_name}",
                    member_type='student',
                    member_id=stud.roll_number,
                    issue_date=today - datetime.timedelta(days=10),
                    due_date=today + datetime.timedelta(days=5),
                    status='issued'
                )
                bk.available_copies -= 1
                bk.save()

        # 15. Seed Placements
        self.stdout.write('Seeding Placement Drives...')
        placement_companies = []
        for cname in ["TCS", "Infosys", "Google India", "Amazon AWS", "Texas Instruments", "L&T Engineering"]:
            placement_companies.append(Company.objects.create(
                name=cname,
                industry="Tech/Engineering",
                website=f"https://www.{cname.lower().replace(' ', '')}.com",
                contact_person=fake.name(),
                contact_email=f"careers@{cname.lower().replace(' ', '')}.com"
            ))
            
        drives = []
        for idx, comp in enumerate(placement_companies):
            drives.append(PlacementDrive.objects.create(
                company=comp,
                title=f"Campus Drive for {comp.name} SDE-1 / GET",
                drive_date=today + datetime.timedelta(days=(idx - 2) * 15),
                venue="Seminar Hall B",
                package_lpa=round(random.uniform(4.5, 25.0), 2),
                eligible_courses="B.Tech, B.E, MBA",
                min_cgpa=6.5 if idx % 2 == 0 else 8.0,
                status="completed" if idx < 3 else "upcoming",
                description="We are hiring GETs and SDEs for our standard technical operations."
            ))
            
        # Applications
        for drv in drives:
            # Eligible students
            el_students = [s for s in all_students if s.cgpa >= drv.min_cgpa][:25]
            for s in el_students:
                status = 'applied' if drv.status == 'upcoming' else random.choice(['selected', 'rejected', 'applied'])
                PlacementApplication.objects.create(
                    drive=drv,
                    student_name=f"{s.first_name} {s.last_name}",
                    student_id=s.roll_number,
                    course=s.course,
                    cgpa=s.cgpa,
                    status=status,
                    offer_letter=(status == 'selected'),
                    package_lpa=drv.package_lpa if status == 'selected' else None
                )

        # 16. Seed Transport Routes and Vehicles
        self.stdout.write('Seeding Transport routes and bus vehicles...')
        routes = []
        for idx in range(1, 5):
            routes.append(Route.objects.create(
                name=f"Route {idx} - Line {chr(64 + idx)}",
                start_point=f"City Hub {idx}",
                end_point="College Main Gate",
                distance_km=15.0 + (idx * 5),
                stops=f"Hub {idx}, Bus Stop {idx*2}, Circle {idx}, College Gate",
                fare=8000.00 + (idx * 2000)
            ))
            
        vehicles = []
        for idx, rt in enumerate(routes, 1):
            vehicles.append(Vehicle.objects.create(
                reg_number=f"KA-03-TR-{idx:04d}",
                vehicle_type="Standard College Bus",
                capacity=50,
                driver_name=fake.name(),
                driver_phone=fake.phone_number()[:15],
                route=rt,
                status="active"
            ))
            
        # Allot transport to 50 students
        for idx, s in enumerate(all_students[:50]):
            rt = routes[idx % len(routes)]
            vh = vehicles[idx % len(vehicles)]
            TransportAllotment.objects.create(
                student_name=f"{s.first_name} {s.last_name}",
                student_id=s.roll_number,
                route=rt,
                vehicle=vh,
                boarding_stop=rt.stops.split(', ')[1],
                valid_from=today - datetime.timedelta(days=90),
                is_active=True
            )

        # 17. Seed Alumni Profiles
        self.stdout.write('Seeding Alumni profiles...')
        for idx in range(1, 26): # 25 alumni profiles
            a_first = fake.first_name()
            a_last = fake.last_name()
            AlumniProfile.objects.create(
                first_name=a_first,
                last_name=a_last,
                email=f"alumni_{idx}@gmail.com",
                phone=fake.phone_number()[:15],
                batch_year=random.choice([2022, 2023, 2024, 2025]),
                course=random.choice([c for c in COURSES_METADATA.keys()]),
                department=random.choice([d.name for d in departments.values()]),
                current_company=fake.company(),
                designation="Software Engineer" if idx % 2 == 0 else "Associate Analyst",
                location=fake.city(),
                linkedin=f"https://linkedin.com/in/alumni{idx}",
                employment_status="employed",
                is_verified=True
            )
            
        # Alumni Event
        alevent = AlumniEvent.objects.create(
            title="Annual Alumni Gala Meet 2026",
            description="Reconnect with your roots and share insights with young minds.",
            event_date=today + datetime.timedelta(days=30),
            venue="Main Campus Lawn",
            status="upcoming"
        )
        
        db_alumni = list(AlumniProfile.objects.all())
        for al in db_alumni[:10]:
            AlumniEventRegistration.objects.create(
                event=alevent,
                alumni=al,
                attended=False
            )
