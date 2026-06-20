import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from alumni.models import AlumniProfile, AlumniEvent, AlumniEventRegistration

FIRST_NAMES = [
    'Arjun', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Ananya', 'Karthik', 'Divya',
    'Suresh', 'Meena', 'Rajesh', 'Kavya', 'Arun', 'Pooja', 'Manoj', 'Lakshmi',
    'Deepak', 'Nisha', 'Sanjay', 'Riya', 'Amit', 'Swathi', 'Naveen', 'Harini',
    'Ganesh', 'Pavithra', 'Vijay', 'Keerthi', 'Ramesh', 'Sowmya', 'Dinesh',
    'Revathi', 'Prasad', 'Geetha', 'Mohan', 'Saranya', 'Bala', 'Indira', 'Ravi',
]

LAST_NAMES = [
    'Kumar', 'Sharma', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Pillai', 'Menon',
    'Singh', 'Gupta', 'Verma', 'Joshi', 'Rao', 'Naidu', 'Krishnan', 'Bhat',
    'Murugan', 'Selvam', 'Pandian', 'Arumugam',
]

COURSES = [
    ('B.Tech - Computer Science & Engineering', 'Computer Science'),
    ('B.Tech - Electronics & Communication Engineering', 'Electronics'),
    ('B.Tech - Mechanical Engineering', 'Mechanical'),
    ('B.Sc - Mathematics', 'Mathematics'),
    ('B.Com - Accounting & Finance', 'Commerce'),
    ('MBA - General Management', 'Management'),
    ('MCA - Software Engineering', 'Computer Science'),
]

COMPANIES = [
    'TCS', 'Infosys', 'Wipro', 'HCL Technologies', 'Cognizant', 'Accenture',
    'Tech Mahindra', 'Capgemini', 'IBM India', 'Oracle India', 'Amazon India',
    'Zoho Corporation', 'Freshworks', 'Hexaware', 'Mphasis', 'L&T Infotech',
    'Mindtree', 'Persistent Systems', 'NIIT Technologies', 'Syntel',
]

DESIGNATIONS = [
    'Software Engineer', 'Senior Software Engineer', 'Systems Analyst',
    'Data Analyst', 'Business Analyst', 'Project Manager', 'Team Lead',
    'DevOps Engineer', 'QA Engineer', 'Product Manager', 'Consultant',
    'Associate Engineer', 'Technical Lead', 'Solutions Architect',
]

HIGHER_STUDIES = ['IIT Madras', 'IIT Bombay', 'NIT Trichy', 'Anna University', 'VIT Vellore', 'BITS Pilani']

LOCATIONS = ['Chennai', 'Bangalore', 'Hyderabad', 'Mumbai', 'Pune', 'Delhi', 'Coimbatore', 'Noida', 'Gurugram']

EVENTS = [
    {
        'title': 'Annual Alumni Meet 2024',
        'description': 'Grand reunion of all alumni batches. Networking, cultural programs, and felicitation of distinguished alumni.',
        'event_date': date(2024, 12, 15),
        'venue': 'College Auditorium, Main Campus',
        'status': 'completed',
    },
    {
        'title': 'Alumni Guest Lecture Series — Tech Trends 2025',
        'description': 'Senior alumni share insights on AI, cloud computing, and emerging technologies with current students.',
        'event_date': date(2025, 2, 10),
        'venue': 'Seminar Hall, Block A',
        'status': 'completed',
    },
    {
        'title': 'Career Guidance & Mentorship Program',
        'description': 'Alumni mentor final-year students on career paths, resume building, and interview preparation.',
        'event_date': date(2025, 6, 20),
        'venue': 'Conference Hall, Admin Block',
        'status': 'upcoming',
    },
    {
        'title': 'Alumni Sports Day 2025',
        'description': 'Friendly cricket, football, and badminton matches between alumni and current students.',
        'event_date': date(2025, 7, 5),
        'venue': 'College Sports Ground',
        'status': 'upcoming',
    },
    {
        'title': 'Silver Jubilee Batch Reunion — 2000 Batch',
        'description': 'Special 25-year reunion for the batch of 2000 with felicitation and campus tour.',
        'event_date': date(2025, 8, 30),
        'venue': 'College Auditorium, Main Campus',
        'status': 'upcoming',
    },
]


def rand_name(used):
    for _ in range(2000):
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        if (fn, ln) not in used:
            used.add((fn, ln))
            return fn, ln
    return f'Alumni{len(used)}', 'X'


class Command(BaseCommand):
    help = 'Seed alumni profiles, events, and registrations'

    def handle(self, *args, **kwargs):
        used_names  = set()
        used_emails = set()

        # ── 1. Alumni profiles (15 per batch × 5 batches) ────────────────
        self.stdout.write('Creating alumni profiles...')
        profile_objs = []
        batches = [2018, 2019, 2020, 2021, 2022]
        emp_statuses = ['employed'] * 7 + ['self_employed'] * 1 + ['higher_studies'] * 1 + ['unemployed'] * 1

        for batch in batches:
            for _ in range(15):
                fn, ln = rand_name(used_names)
                email  = f'{fn.lower()}.{ln.lower()}{batch}@alumni.edu'
                while email in used_emails:
                    email = f'{fn.lower()}.{ln.lower()}{batch}{random.randint(1,99)}@alumni.edu'
                used_emails.add(email)

                course, dept = random.choice(COURSES)
                emp_status   = random.choice(emp_statuses)

                company     = ''
                designation = ''
                location    = random.choice(LOCATIONS)
                linkedin    = f'https://linkedin.com/in/{fn.lower()}-{ln.lower()}-{random.randint(100,999)}'

                if emp_status == 'employed':
                    company     = random.choice(COMPANIES)
                    designation = random.choice(DESIGNATIONS)
                elif emp_status == 'self_employed':
                    company     = f'{fn} & Associates'
                    designation = 'Founder'
                elif emp_status == 'higher_studies':
                    company     = random.choice(HIGHER_STUDIES)
                    designation = 'M.Tech Student'

                profile, created = AlumniProfile.objects.get_or_create(
                    email=email,
                    defaults={
                        'first_name':        fn,
                        'last_name':         ln,
                        'phone':             f'9{random.randint(100000000, 999999999)}',
                        'batch_year':        batch,
                        'course':            course,
                        'department':        dept,
                        'current_company':   company,
                        'designation':       designation,
                        'location':          location,
                        'linkedin':          linkedin,
                        'employment_status': emp_status,
                        'is_verified':       random.random() > 0.3,
                    },
                )
                if created:
                    profile_objs.append(profile)
                    self.stdout.write(f'  [New] {fn} {ln} ({batch}) | {emp_status} | {company or "—"}')

        self.stdout.write(f'  Total profiles created: {len(profile_objs)}')

        # ── 2. Events ─────────────────────────────────────────────────────
        self.stdout.write('\nCreating alumni events...')
        event_objs = []
        for e in EVENTS:
            obj, created = AlumniEvent.objects.get_or_create(
                title=e['title'], defaults={k: v for k, v in e.items() if k != 'title'}
            )
            event_objs.append(obj)
            self.stdout.write(f'  {"[New]" if created else "[Skip]"} {obj.title} — {obj.status}')

        # ── 3. Event registrations ────────────────────────────────────────
        self.stdout.write('\nCreating event registrations...')
        all_profiles = list(AlumniProfile.objects.all())
        reg_count = 0

        for event in event_objs:
            sample_size = random.randint(20, min(40, len(all_profiles)))
            attendees   = random.sample(all_profiles, sample_size)
            for alumni in attendees:
                _, created = AlumniEventRegistration.objects.get_or_create(
                    event=event, alumni=alumni,
                    defaults={'attended': event.status == 'completed' and random.random() > 0.2},
                )
                if created:
                    reg_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nDone! {len(profile_objs)} alumni profiles, {len(event_objs)} events, {reg_count} registrations created.'
        ))
