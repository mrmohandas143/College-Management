from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from datetime import date, time, timedelta
import random

from departments.models import Department
from students.models import Student
from faculty.models import Faculty
from academics.models import Subject, AcademicCalendar
from timetable.models import TimetableEntry
from attendance.models import AttendanceSession, StudentAttendance
from examination.models import Exam, ExamResult
from fees.models import FeeStructure, Fee
from placement.models import Company, PlacementDrive, PlacementApplication
from notifications.models import Notification

User = get_user_model()

DEPARTMENTS = [
    {'name': 'Computer Science', 'course': 'B.Tech', 'spec': 'Computer Science & Engineering', 'prefix': 'CS'},
    {'name': 'Electronics',      'course': 'B.Tech', 'spec': 'Electronics & Communication Engineering', 'prefix': 'EC'},
    {'name': 'Mechanical',       'course': 'B.Tech', 'spec': 'Mechanical Engineering', 'prefix': 'ME'},
    {'name': 'Mathematics',      'course': 'B.Sc',   'spec': 'Mathematics', 'prefix': 'MA'},
    {'name': 'Commerce',         'course': 'B.Com',  'spec': 'Accounting & Finance', 'prefix': 'CO'},
    {'name': 'Management',       'course': 'MBA',    'spec': 'General Management', 'prefix': 'MB'},
]

FIRST_NAMES = ['Arjun','Priya','Rahul','Sneha','Vikram','Ananya','Karthik','Divya',
               'Suresh','Meena','Rajesh','Kavya','Arun','Pooja','Manoj','Lakshmi',
               'Deepak','Nisha','Sanjay','Riya','Amit','Swathi','Naveen','Harini',
               'Ganesh','Pavithra','Vijay','Keerthi','Ramesh','Sowmya','Dinesh','Revathi',
               'Prasad','Geetha','Mohan','Saranya','Bala','Indira','Ravi','Chitra']

LAST_NAMES = ['Kumar','Sharma','Patel','Reddy','Nair','Iyer','Pillai','Menon',
              'Singh','Gupta','Verma','Joshi','Rao','Naidu','Krishnan','Bhat',
              'Murugan','Selvam','Pandian','Arumugam']

QUALIFICATIONS = ['Ph.D', 'M.Tech', 'M.Sc', 'M.Phil', 'MBA', 'M.Com']
GENDERS = ['male', 'female']

SUBJECT_POOL = {
    'Computer Science': [
        ('Programming in C', 'CS101', 1, 3, 'theory'),
        ('Data Structures & Algorithms', 'CS201', 3, 4, 'theory'),
        ('Database Management Systems', 'CS301', 5, 4, 'theory'),
        ('Object Oriented Programming Lab', 'CS202', 3, 2, 'practical'),
        ('Artificial Intelligence', 'CS401', 7, 3, 'theory'),
    ],
    'Electronics': [
        ('Basic Electronics', 'EC101', 1, 3, 'theory'),
        ('Signals and Systems', 'EC201', 3, 4, 'theory'),
        ('Microprocessors & Microcontrollers', 'EC301', 5, 4, 'theory'),
        ('Digital Signal Processing Lab', 'EC302', 5, 2, 'practical'),
        ('VLSI Design', 'EC401', 7, 3, 'theory'),
    ],
    'Mechanical': [
        ('Engineering Mechanics', 'ME101', 1, 3, 'theory'),
        ('Thermodynamics', 'ME201', 3, 4, 'theory'),
        ('Fluid Mechanics', 'ME301', 5, 4, 'theory'),
        ('Computer Aided Design Lab', 'ME302', 5, 2, 'practical'),
        ('Heat and Mass Transfer', 'ME401', 7, 3, 'theory'),
    ],
    'Mathematics': [
        ('Calculus & Analytical Geometry', 'MA101', 1, 4, 'theory'),
        ('Linear Algebra', 'MA201', 2, 4, 'theory'),
        ('Discrete Mathematics', 'MA301', 3, 3, 'theory'),
        ('Numerical Methods Lab', 'MA302', 4, 2, 'practical'),
        ('Probability & Statistics', 'MA401', 5, 4, 'theory'),
    ],
    'Commerce': [
        ('Financial Accounting', 'CO101', 1, 4, 'theory'),
        ('Business Law', 'CO201', 2, 3, 'theory'),
        ('Corporate Accounting', 'CO301', 3, 4, 'theory'),
        ('Tally ERP Lab', 'CO302', 4, 2, 'practical'),
        ('Cost & Management Accounting', 'CO401', 5, 4, 'theory'),
    ],
    'Management': [
        ('Principles of Management', 'MB101', 1, 3, 'theory'),
        ('Organizational Behaviour', 'MB201', 2, 3, 'theory'),
        ('Marketing Management', 'MB301', 3, 4, 'theory'),
        ('Business Communication Lab', 'MB302', 2, 2, 'practical'),
        ('Strategic Management', 'MB401', 4, 4, 'theory'),
    ],
}

def rand_name(used):
    for _ in range(1000):
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        if (fn, ln) not in used:
            used.add((fn, ln))
            return fn, ln
    return f'Name{len(used)}', 'X'


class Command(BaseCommand):
    help = 'Seed comprehensive data: Departments, Faculty, Students, Academics, Timetable, Exams, Attendance, Fees, Placements, Notifications'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Cleaning existing data...'))
        
        # Clean Students and Faculty (and their linked users)
        User.objects.filter(role__in=['student', 'faculty', 'parent']).delete()
        Student.objects.all().delete()
        Faculty.objects.all().delete()
        
        # Clean other related models
        Department.objects.all().delete()
        Subject.objects.all().delete()
        AcademicCalendar.objects.all().delete()
        TimetableEntry.objects.all().delete()
        AttendanceSession.objects.all().delete()
        StudentAttendance.objects.all().delete()
        Exam.objects.all().delete()
        ExamResult.objects.all().delete()
        FeeStructure.objects.all().delete()
        Fee.objects.all().delete()
        Company.objects.all().delete()
        PlacementDrive.objects.all().delete()
        PlacementApplication.objects.all().delete()
        Notification.objects.all().delete()

        used_names = set()
        used_emails = set()
        used_reg = set()
        total_f = 0
        total_s = 0

        # ── 1. Seed Departments, Faculty, Students and Logins ──────────────
        for dept in DEPARTMENTS:
            dname  = dept['name']
            course = dept['course']
            spec   = dept['spec']
            prefix = dept['prefix']
            full_course = f"{course} - {spec}"

            self.stdout.write(f'\nDepartment: {dname}')

            # 1 HOD + 6 teaching faculty + 3 staff = 10 per dept
            roles = (
                [('HOD', random.randint(15, 20))] +
                [('Professor', random.randint(10, 18)) for _ in range(2)] +
                [('Associate Professor', random.randint(7, 12)) for _ in range(2)] +
                [('Assistant Professor', random.randint(3, 7)) for _ in range(2)] +
                [('Lecturer', random.randint(1, 3)) for _ in range(3)]
            )

            hod_name = ""
            for i, (designation, exp) in enumerate(roles):
                fn, ln = rand_name(used_names)
                base = f"{fn.lower()}.{ln.lower()}"
                email = f"{base}.{prefix.lower()}{i}@college.edu"
                while email in used_emails:
                    email = f"{base}.{prefix.lower()}{i}{random.randint(1,99)}@college.edu"
                used_emails.add(email)
                
                phone = f'9{random.randint(100000000,999999999)}'

                faculty, _ = Faculty.objects.get_or_create(
                    email=email,
                    defaults={
                        'first_name': fn, 'last_name': ln,
                        'phone': phone,
                        'department': dname, 'course': course,
                        'designation': designation,
                        'qualification': random.choice(QUALIFICATIONS),
                        'experience': exp, 'status': 'active',
                    }
                )
                
                # Create corresponding User account
                username = f"{fn.lower()}_{ln.lower()}{random.randint(10,99)}"
                User.objects.create_user(
                    username=username,
                    email=email,
                    password='Faculty@123',
                    role='faculty',
                    full_name=f'{fn} {ln}',
                    phone=phone,
                    department=dname,
                )
                
                total_f += 1
                if designation == 'HOD':
                    hod_name = f'Dr. {fn} {ln}'
                self.stdout.write(f'  [Faculty] {fn} {ln} - {designation} (User: {username})')

            # Create Department record
            Department.objects.get_or_create(
                name=dname,
                defaults={
                    'code': prefix,
                    'description': f'Department of {dname} focusing on academic excellence, research, and holistic student development.',
                    'head': hod_name,
                }
            )

            # 20 students per department
            for i in range(1, 21):
                fn, ln = rand_name(used_names)
                base = f"{fn.lower()}.{ln.lower()}"
                email = f"{base}.{prefix.lower()}{i}@student.edu"
                while email in used_emails:
                    email = f"{base}.{prefix.lower()}{i}{random.randint(1,99)}@student.edu"
                used_emails.add(email)

                reg = f"{prefix}{2024}{i:03d}"
                while reg in used_reg:
                    reg = f"{prefix}{2024}{i:03d}{random.randint(1,9)}"
                used_reg.add(reg)

                phone = f'9{random.randint(100000000,999999999)}'
                student, _ = Student.objects.get_or_create(
                    register_number=reg,
                    defaults={
                        'first_name': fn, 'last_name': ln,
                        'email': email,
                        'phone': phone,
                        'roll_number': reg,
                        'gender': random.choice(GENDERS),
                        'date_of_birth': f'{random.randint(2000,2005)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}',
                        'address': f'{random.randint(1,100)}, Main Street, Chennai',
                        'course': full_course, 'department': dname,
                        'year': random.randint(1, 4), 'status': 'active',
                        'cgpa': round(random.uniform(6.0, 9.8), 2),
                        'attendance_percentage': round(random.uniform(65.0, 98.0), 2),
                    }
                )
                
                # Create corresponding User account
                User.objects.create_user(
                    username=reg,
                    email=email,
                    password='Student@123',
                    role='student',
                    linked_student=student,
                    full_name=f'{fn} {ln}',
                    phone=phone,
                    department=dname,
                )

                # Create parent account for 50% of the students
                if random.random() > 0.5:
                    parent_username = f"parent_{reg.lower()}"
                    User.objects.create_user(
                        username=parent_username,
                        email=f"parent.{email}",
                        password='Parent@123',
                        role='parent',
                        linked_student=student,
                        full_name=f'Mr./Mrs. {ln}',
                        phone=f'9{random.randint(100000000,999999999)}',
                    )

                total_s += 1

            self.stdout.write(f'  20 students & login credentials created for {dname}')

        # ── 2. Seed Academics ──────────────────────────────────────────────
        self.stdout.write('\nSeeding academic subjects...')
        all_subjects = []
        for dname, subjects in SUBJECT_POOL.items():
            for name, code, sem, cred, stype in subjects:
                fac_pool = Faculty.objects.filter(department=dname)
                fac_name = ""
                if fac_pool.exists():
                    fac = random.choice(fac_pool)
                    fac_name = f"{fac.first_name} {fac.last_name}"
                
                sub = Subject.objects.create(
                    name=name,
                    code=code,
                    course='B.Tech' if dname in ['Computer Science', 'Electronics', 'Mechanical'] else ('B.Sc' if dname == 'Mathematics' else ('B.Com' if dname == 'Commerce' else 'MBA')),
                    department=dname,
                    semester=sem,
                    credits=cred,
                    subject_type=stype,
                    faculty_name=fac_name,
                    is_active=True
                )
                all_subjects.append(sub)

        self.stdout.write('Seeding academic calendar events...')
        AcademicCalendar.objects.create(
            title='Odd Semester Reopening 2024',
            event_type='semester_start',
            start_date=date(2024, 6, 15),
            description='Classes commence for all odd semester courses.',
            academic_year='2024-25'
        )
        AcademicCalendar.objects.create(
            title='Independence Day Holiday',
            event_type='holiday',
            start_date=date(2024, 8, 15),
            description='National Holiday.',
            academic_year='2024-25'
        )
        AcademicCalendar.objects.create(
            title='Mid-Term Examinations',
            event_type='exam',
            start_date=date(2024, 9, 20),
            end_date=date(2024, 9, 28),
            description='Mid-term internal assessments.',
            academic_year='2024-25'
        )
        AcademicCalendar.objects.create(
            title='Annual Sports Meet 2024',
            event_type='event',
            start_date=date(2024, 10, 10),
            end_date=date(2024, 10, 12),
            description='Annual inter-departmental sports events.',
            academic_year='2024-25'
        )
        AcademicCalendar.objects.create(
            title='End-Semester Examinations',
            event_type='exam',
            start_date=date(2024, 11, 15),
            end_date=date(2024, 11, 30),
            description='Final theory and practical examinations.',
            academic_year='2024-25'
        )

        # ── 3. Seed Timetable ──────────────────────────────────────────────
        self.stdout.write('Seeding timetable entries...')
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        periods = [
            (1, time(9, 0), time(10, 0)),
            (2, time(10, 0), time(11, 0)),
            (3, time(11, 15), time(12, 15)),
            (4, time(13, 15), time(14, 15)),
            (5, time(14, 15), time(15, 15)),
        ]
        
        for dname in SUBJECT_POOL.keys():
            course_name = 'B.Tech' if dname in ['Computer Science', 'Electronics', 'Mechanical'] else ('B.Sc' if dname == 'Mathematics' else ('B.Com' if dname == 'Commerce' else 'MBA'))
            sub_list = Subject.objects.filter(department=dname)
            if not sub_list.exists():
                continue
            for sem in [1, 3, 5, 7]:
                sem_subs = list(sub_list.filter(semester=sem))
                if not sem_subs:
                    sem_subs = list(sub_list)
                
                for day in days:
                    for p_num, start_t, end_t in periods:
                        sub = random.choice(sem_subs)
                        TimetableEntry.objects.create(
                            course=f"{course_name} - {dname}",
                            department=dname,
                            semester=sem,
                            day=day,
                            period=p_num,
                            start_time=start_t,
                            end_time=end_t,
                            subject=sub.name,
                            subject_code=sub.code,
                            faculty_name=sub.faculty_name,
                            room=f"Block {dname[0]}-{100 + sem*10 + p_num}",
                            academic_year='2024-25'
                        )

        # ── 4. Seed Student Attendance ─────────────────────────────────────
        self.stdout.write('Seeding student attendance sessions and records...')
        all_students = Student.objects.filter(status='active')
        today = date.today()
        
        for offset in range(5):
            sess_date = today - timedelta(days=offset)
            if sess_date.weekday() == 6: # Skip Sunday
                continue
            
            for dname in SUBJECT_POOL.keys():
                dept_students = all_students.filter(department=dname)
                if not dept_students.exists():
                    continue
                
                course_name = 'B.Tech' if dname in ['Computer Science', 'Electronics', 'Mechanical'] else ('B.Sc' if dname == 'Mathematics' else ('B.Com' if dname == 'Commerce' else 'MBA'))
                sub_list = Subject.objects.filter(department=dname)
                if not sub_list.exists():
                    continue
                
                # Session 1 (Period 1)
                sub = random.choice(sub_list)
                sess = AttendanceSession.objects.create(
                    date=sess_date,
                    course=f"{course_name} - {dname}",
                    department=dname,
                    subject=sub.name,
                    faculty_name=sub.faculty_name,
                    period=1
                )
                
                # Attendance records for all students in this session
                for student in dept_students:
                    rand = random.random()
                    status = 'present' if rand < 0.90 else ('absent' if rand < 0.98 else 'late')
                    StudentAttendance.objects.create(
                        session=sess,
                        student=student,
                        status=status,
                        remarks='Regular class' if status == 'present' else ('Medical leave' if status == 'absent' else 'Late arrival')
                    )

        # ── 5. Seed Examinations and Results ──────────────────────────────
        self.stdout.write('Seeding examinations and results...')
        for dname in SUBJECT_POOL.keys():
            course_name = 'B.Tech' if dname in ['Computer Science', 'Electronics', 'Mechanical'] else ('B.Sc' if dname == 'Mathematics' else ('B.Com' if dname == 'Commerce' else 'MBA'))
            sub_list = Subject.objects.filter(department=dname)
            dept_students = all_students.filter(department=dname)
            if not sub_list.exists() or not dept_students.exists():
                continue
            
            for sub in sub_list:
                # Completed Exam
                ex1 = Exam.objects.create(
                    name='Internal Assessment I',
                    exam_type='internal',
                    course=f"{course_name} - {dname}",
                    department=dname,
                    semester=sub.semester,
                    subject=sub.name,
                    subject_code=sub.code,
                    exam_date=today - timedelta(days=20),
                    start_time=time(9, 30),
                    end_time=time(11, 0),
                    room='Examination Hall A',
                    max_marks=50,
                    pass_marks=20,
                    status='completed',
                    academic_year='2024-25'
                )
                
                # Results
                for student in dept_students:
                    marks = round(random.uniform(15.0, 49.0), 2)
                    ExamResult.objects.create(
                        exam=ex1,
                        student=student,
                        marks_obtained=marks,
                        remarks='Good performance' if marks >= 35 else ('Average' if marks >= 20 else 'Needs improvement'),
                        entered_by='Controller of Exams'
                    )
                
                # Scheduled Exam
                Exam.objects.create(
                    name='End Semester Theory Exam',
                    exam_type='external',
                    course=f"{course_name} - {dname}",
                    department=dname,
                    semester=sub.semester,
                    subject=sub.name,
                    subject_code=sub.code,
                    exam_date=today + timedelta(days=15),
                    start_time=time(10, 0),
                    end_time=time(13, 0),
                    room='Main Auditorium',
                    max_marks=100,
                    pass_marks=40,
                    status='scheduled',
                    academic_year='2024-25'
                )

        # ── 6. Seed Fee Structures and Fees ───────────────────────────────
        self.stdout.write('Seeding fee structures and fees...')
        for dname in SUBJECT_POOL.keys():
            course_name = 'B.Tech' if dname in ['Computer Science', 'Electronics', 'Mechanical'] else ('B.Sc' if dname == 'Mathematics' else ('B.Com' if dname == 'Commerce' else 'MBA'))
            
            # Annual Tuition Fee Structure
            fs_tuition = FeeStructure.objects.create(
                name='Annual Tuition Fee',
                fee_type='tuition',
                amount=60000 if course_name == 'B.Tech' else 40000,
                course=f"{course_name} - {dname}",
                department=dname,
                academic_year='2024-25',
                is_active=True,
                description='Tuition fee for the academic year 2024-25.'
            )
            
            # Semester Exam Fee Structure
            fs_exam = FeeStructure.objects.create(
                name='Semester Exam Fee',
                fee_type='exam',
                amount=1500,
                course=f"{course_name} - {dname}",
                department=dname,
                academic_year='2024-25',
                is_active=True,
                description='Examination fee for the odd semester.'
            )
            
            # Generate fees for students
            dept_students = all_students.filter(department=dname)
            for student in dept_students:
                t_status = 'paid' if random.random() > 0.3 else 'pending'
                t_paid_date = today - timedelta(days=random.randint(15, 60)) if t_status == 'paid' else None
                Fee.objects.create(
                    student=student,
                    fee_structure=fs_tuition,
                    amount=fs_tuition.amount,
                    fee_type=fs_tuition.name,
                    semester=student.year * 2 - 1,
                    academic_year='2024-25',
                    due_date=today - timedelta(days=10),
                    paid_date=t_paid_date,
                    status=t_status,
                    payment_mode='online' if t_status == 'paid' else '',
                    transaction_id=f"TXN{random.randint(10000000,99999999)}" if t_status == 'paid' else '',
                )
                
                e_rand = random.random()
                e_status = 'paid' if e_rand < 0.60 else ('pending' if e_rand < 0.90 else 'overdue')
                e_paid_date = today - timedelta(days=random.randint(1, 5)) if e_status == 'paid' else None
                Fee.objects.create(
                    student=student,
                    fee_structure=fs_exam,
                    amount=fs_exam.amount,
                    fee_type=fs_exam.name,
                    semester=student.year * 2 - 1,
                    academic_year='2024-25',
                    due_date=today + timedelta(days=5) if e_status != 'overdue' else today - timedelta(days=5),
                    paid_date=e_paid_date,
                    status=e_status,
                    payment_mode='upi' if e_status == 'paid' else '',
                    transaction_id=f"UPI{random.randint(10000000,99999999)}" if e_status == 'paid' else '',
                )

        # ── 7. Seed Placements ─────────────────────────────────────────────
        self.stdout.write('Seeding placements companies and drives...')
        c1 = Company.objects.create(name='Google India', industry='Technology', website='https://google.com', contact_person='Amit Patel', contact_email='careers@google.com', contact_phone='9898989898')
        c2 = Company.objects.create(name='Microsoft India', industry='Technology', website='https://microsoft.com', contact_person='Sarah Dsouza', contact_email='recruit@microsoft.com', contact_phone='9898989899')
        c3 = Company.objects.create(name='Tata Consultancy Services', industry='IT Services', website='https://tcs.com', contact_person='Ravi Sharma', contact_email='campus@tcs.com', contact_phone='9898989800')
        c4 = Company.objects.create(name='Zoho Corporation', industry='Software Development', website='https://zoho.com', contact_person='Gokul R', contact_email='recruitment@zohocorp.com', contact_phone='9898989811')
        
        # Drives
        d1 = PlacementDrive.objects.create(
            company=c1,
            title='Software Engineer - Summer Intake',
            drive_date=today - timedelta(days=10),
            venue='Placement Block Hall 1',
            package_lpa=18.5,
            eligible_courses='B.Tech - Computer Science & Engineering, B.Tech - Electronics & Communication Engineering',
            min_cgpa=8.5,
            status='completed',
            description='Google recruiting software development engineers.'
        )
        d2 = PlacementDrive.objects.create(
            company=c4,
            title='Member Technical Staff',
            drive_date=today + timedelta(days=10),
            venue='College Placement Cell',
            package_lpa=8.0,
            eligible_courses='B.Tech - Computer Science & Engineering, B.Tech - Electronics & Communication Engineering, MCA',
            min_cgpa=7.0,
            status='upcoming',
            description='Zoho recruitment drive for product developers.'
        )
        
        # Placement Applications
        eligible_students = all_students.filter(year=4, cgpa__gte=7.0)
        for s in eligible_students:
            # Apply to Zoho
            PlacementApplication.objects.create(
                drive=d2,
                student_name=f"{s.first_name} {s.last_name}",
                student_id=s.register_number,
                course=s.course,
                cgpa=s.cgpa,
                status='applied'
            )
            
            # Apply to Google
            if s.cgpa >= 8.5:
                status_choice = random.choice(['selected', 'shortlisted', 'rejected'])
                PlacementApplication.objects.create(
                    drive=d1,
                    student_name=f"{s.first_name} {s.last_name}",
                    student_id=s.register_number,
                    course=s.course,
                    cgpa=s.cgpa,
                    status=status_choice,
                    offer_letter=status_choice == 'selected',
                    package_lpa=d1.package_lpa if status_choice == 'selected' else None
                )

        # ── 8. Seed Notifications ──────────────────────────────────────────
        self.stdout.write('Seeding notifications...')
        Notification.objects.create(
            title='College Reopens for Academic Year 2024-25',
            message='All students and faculty members are informed that the college reopens on July 15th, 2024. Attendance on the first day is mandatory.',
            notif_type='info',
            target='all',
            is_active=True,
            created_by='Principal Office'
        )
        Notification.objects.create(
            title='Library Book Return Alert',
            message='Please return all borrowed books by the end of the month to avoid fine accumulation. The librarian portal is active.',
            notif_type='warning',
            target='students',
            is_active=True,
            created_by='Chief Librarian'
        )
        Notification.objects.create(
            title='Faculty Meeting — Odd Semester Planning',
            message='A meeting of all teaching staff is scheduled on June 28th at 10:30 AM in the Boardroom to discuss subject allotments and timetables.',
            notif_type='info',
            target='faculty',
            is_active=True,
            created_by='Dean Academics'
        )
        Notification.objects.create(
            title='Hostel Fee Payment Deadline Extended',
            message='The deadline for payment of Hostel Fees for the upcoming semester has been extended to July 5th, 2024. Please pay online.',
            notif_type='alert',
            target='parents',
            is_active=True,
            created_by='Chief Warden'
        )

        self.stdout.write(self.style.SUCCESS(
            f'\nDone! {total_f} faculty and {total_s} students (with logins) seeded. All other modules populated.'
        ))
