import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from departments.models import Department
from faculty.models import Faculty
from hr.models import Employee, PayrollConfig

SALARY_MAP = {
    'hod':                 (80000, 100000),
    'professor':           (70000,  90000),
    'associate professor': (55000,  70000),
    'assistant professor': (40000,  55000),
    'lecturer':            (30000,  40000),
    'lab technician':      (25000,  35000),
}
DEFAULT_SALARY = (28000, 45000)


def salary_for(designation):
    return random.randint(*SALARY_MAP.get(designation.lower(), DEFAULT_SALARY))


def rand_date(start_year=2010, end_year=2023):
    start = date(start_year, 1, 1)
    end   = date(end_year, 12, 31)
    return start + timedelta(days=random.randint(0, (end - start).days))


def rand_dob(min_age=25, max_age=58):
    today = date.today()
    start = today.replace(year=today.year - max_age)
    end   = today.replace(year=today.year - min_age)
    return start + timedelta(days=random.randint(0, (end - start).days))


class Command(BaseCommand):
    help = 'Sync Faculty records into the HR Employee module'

    def handle(self, *args, **kwargs):
        # Build a name→Department lookup (case-insensitive)
        dept_map = {d.name.lower(): d for d in Department.objects.all()}

        faculties = Faculty.objects.all()
        if not faculties.exists():
            self.stdout.write(self.style.ERROR('No faculty records found. Run seed_data first.'))
            return

        created_count = skipped_count = 0
        emp_counter = Employee.objects.count()

        for fac in faculties:
            # Skip if already linked
            if Employee.objects.filter(faculty=fac).exists():
                self.stdout.write(f'  [Skip] {fac} — already linked')
                skipped_count += 1
                continue

            # Resolve department object
            dept = dept_map.get(fac.department.lower())

            emp_counter += 1
            emp_id = f'EMP{emp_counter:04d}'

            emp = Employee.objects.create(
                employee_id     = emp_id,
                first_name      = fac.first_name,
                last_name       = fac.last_name,
                email           = fac.email,
                phone           = fac.phone,
                department      = dept,
                designation     = fac.designation,
                employment_type = 'full_time',
                date_of_joining = rand_date(),
                basic_salary    = salary_for(fac.designation),
                status          = 'active' if fac.status == 'active' else 'inactive',
                gender          = random.choice(['male', 'female']),
                date_of_birth   = rand_dob(),
                address         = f'{random.randint(1, 200)}, Main Street, Chennai',
                faculty         = fac,
            )
            PayrollConfig.objects.get_or_create(employee=emp)

            created_count += 1
            self.stdout.write(
                f'  [New] {emp.employee_id} | {fac.first_name} {fac.last_name} '
                f'| {fac.designation} | {fac.department} | Rs.{emp.basic_salary:,}'
            )

        self.stdout.write(self.style.SUCCESS(
            f'\nDone! {created_count} employees created, {skipped_count} skipped.'
        ))
