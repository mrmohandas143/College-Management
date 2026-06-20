from django.core.management.base import BaseCommand
from students.models import Student
from faculty.models import Faculty
import random

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


def rand_name(used):
    for _ in range(1000):
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        if (fn, ln) not in used:
            used.add((fn, ln))
            return fn, ln
    return f'Name{len(used)}', 'X'


class Command(BaseCommand):
    help = 'Seed: 1 HOD + 6 faculty + 3 staff + 20 students per department'

    def handle(self, *args, **kwargs):
        used_names = set()
        used_emails = set()
        used_reg = set()
        total_f = 0
        total_s = 0

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

            for i, (designation, exp) in enumerate(roles):
                fn, ln = rand_name(used_names)
                base = f"{fn.lower()}.{ln.lower()}"
                email = f"{base}.{prefix.lower()}{i}@college.edu"
                while email in used_emails:
                    email = f"{base}.{prefix.lower()}{i}{random.randint(1,99)}@college.edu"
                used_emails.add(email)

                Faculty.objects.get_or_create(
                    email=email,
                    defaults={
                        'first_name': fn, 'last_name': ln,
                        'phone': f'9{random.randint(100000000,999999999)}',
                        'department': dname, 'course': course,
                        'designation': designation,
                        'qualification': random.choice(QUALIFICATIONS),
                        'experience': exp, 'status': 'active',
                    }
                )
                total_f += 1
                self.stdout.write(f'  [Faculty] {fn} {ln} - {designation}')

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

                Student.objects.get_or_create(
                    register_number=reg,
                    defaults={
                        'first_name': fn, 'last_name': ln,
                        'email': email,
                        'phone': f'9{random.randint(100000000,999999999)}',
                        'gender': random.choice(GENDERS),
                        'date_of_birth': f'{random.randint(2000,2005)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}',
                        'address': f'{random.randint(1,100)}, Main Street, Chennai',
                        'course': full_course, 'department': dname,
                        'year': random.randint(1, 4), 'status': 'active',
                        'cgpa': round(random.uniform(6.0, 9.8), 2),
                        'attendance_percentage': round(random.uniform(65.0, 98.0), 2),
                    }
                )
                total_s += 1

            self.stdout.write(f'  20 students added for {dname}')

        self.stdout.write(self.style.SUCCESS(
            f'\nDone! {total_f} faculty and {total_s} students seeded across {len(DEPARTMENTS)} departments.'
        ))
