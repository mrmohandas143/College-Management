import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from library.models import BookCategory, Book, BookIssue
from students.models import Student
from faculty.models import Faculty

CATEGORIES = [
    'Computer Science', 'Electronics & Communication', 'Mechanical Engineering',
    'Mathematics', 'Commerce & Finance', 'Management', 'Physics', 'Chemistry',
    'English Literature', 'General Knowledge', 'Reference', 'Competitive Exams',
]

BOOKS = [
    # Computer Science
    ('Introduction to Algorithms',              'Cormen, Leiserson, Rivest',  'Computer Science',              'MIT Press',       '4th', '978-0262033848', 5),
    ('Clean Code',                              'Robert C. Martin',           'Computer Science',              'Prentice Hall',   '1st', '978-0132350884', 4),
    ('Design Patterns',                         'Gang of Four',               'Computer Science',              'Addison-Wesley',  '1st', '978-0201633610', 3),
    ('The Pragmatic Programmer',                'Hunt & Thomas',              'Computer Science',              'Addison-Wesley',  '2nd', '978-0135957059', 4),
    ('Computer Networks',                       'Andrew Tanenbaum',           'Computer Science',              'Pearson',         '5th', '978-0132126953', 5),
    ('Operating System Concepts',               'Silberschatz & Galvin',      'Computer Science',              'Wiley',           '10th','978-1119800361', 4),
    ('Database System Concepts',               'Silberschatz & Korth',       'Computer Science',              'McGraw-Hill',     '7th', '978-0078022159', 4),
    ('Artificial Intelligence: A Modern Approach','Russell & Norvig',         'Computer Science',              'Pearson',         '4th', '978-0134610993', 3),
    ('Python Crash Course',                     'Eric Matthes',               'Computer Science',              'No Starch Press', '3rd', '978-1718502703', 5),
    ('Data Structures Using C',                 'Reema Thareja',              'Computer Science',              'Oxford',          '3rd', '978-0199459162', 6),
    # Electronics
    ('Electronic Devices and Circuit Theory',   'Robert Boylestad',           'Electronics & Communication',   'Pearson',         '11th','978-0132622264', 4),
    ('Signals and Systems',                     'Oppenheim & Willsky',        'Electronics & Communication',   'Pearson',         '2nd', '978-0138147570', 3),
    ('Digital Electronics',                     'Morris Mano',                'Electronics & Communication',   'Pearson',         '5th', '978-0132774208', 5),
    ('Microprocessors and Microcontrollers',    'A.K. Ray',                   'Electronics & Communication',   'PHI Learning',    '2nd', '978-8120340725', 4),
    ('Communication Systems',                   'Haykin & Moher',             'Electronics & Communication',   'Wiley',           '5th', '978-0471697909', 3),
    # Mechanical
    ('Engineering Mechanics',                   'R.C. Hibbeler',              'Mechanical Engineering',        'Pearson',         '14th','978-0133918922', 5),
    ('Thermodynamics: An Engineering Approach', 'Cengel & Boles',             'Mechanical Engineering',        'McGraw-Hill',     '9th', '978-1259822674', 4),
    ('Fluid Mechanics',                         'Frank White',                'Mechanical Engineering',        'McGraw-Hill',     '8th', '978-0073398273', 3),
    ('Strength of Materials',                   'R.K. Bansal',                'Mechanical Engineering',        'Laxmi Publications','4th','978-8131808146', 5),
    ('Machine Design',                          'V.B. Bhandari',              'Mechanical Engineering',        'McGraw-Hill',     '4th', '978-9352606290', 4),
    # Mathematics
    ('Higher Engineering Mathematics',          'B.S. Grewal',                'Mathematics',                   'Khanna Publishers','44th','978-8174091955', 8),
    ('Calculus',                                'James Stewart',              'Mathematics',                   'Cengage',         '8th', '978-1285740621', 5),
    ('Linear Algebra',                          'Gilbert Strang',             'Mathematics',                   'Wellesley-Cambridge','5th','978-0980232776',4),
    ('Discrete Mathematics',                    'Kenneth Rosen',              'Mathematics',                   'McGraw-Hill',     '8th', '978-0072899054', 5),
    ('Probability and Statistics',              'Walpole, Myers & Myers',     'Mathematics',                   'Pearson',         '9th', '978-0321629111', 4),
    # Commerce & Finance
    ('Financial Accounting',                    'R.L. Gupta & V.K. Gupta',   'Commerce & Finance',            'Sultan Chand',    '26th','978-8180548697', 5),
    ('Principles of Management',                'Koontz & Weihrich',          'Management',                    'McGraw-Hill',     '12th','978-0070681880', 4),
    ('Business Economics',                      'D.N. Dwivedi',               'Commerce & Finance',            'Vikas Publishing','8th', '978-8125918493', 4),
    ('Cost Accounting',                         'M.N. Arora',                 'Commerce & Finance',            'Himalaya Publishing','20th','978-9350978610',5),
    ('Corporate Finance',                       'Brealey, Myers & Allen',     'Commerce & Finance',            'McGraw-Hill',     '13th','978-1260013900', 3),
    # Management
    ('Organizational Behaviour',                'Stephen Robbins',            'Management',                    'Pearson',         '18th','978-0134729329', 5),
    ('Strategic Management',                    'Fred David',                 'Management',                    'Pearson',         '16th','978-0134153971', 4),
    ('Human Resource Management',               'Gary Dessler',               'Management',                    'Pearson',         '16th','978-0134235455', 4),
    ('Marketing Management',                    'Philip Kotler',              'Management',                    'Pearson',         '15th','978-0133856460', 5),
    ('Operations Management',                   'William Stevenson',          'Management',                    'McGraw-Hill',     '13th','978-1259667473', 3),
    # General / Reference
    ('The Alchemist',                           'Paulo Coelho',               'English Literature',            'HarperCollins',   '1st', '978-0062315007', 4),
    ('Wings of Fire',                           'A.P.J. Abdul Kalam',         'General Knowledge',             'Universities Press','1st','978-8173711466', 6),
    ('Competitive Exams Guide',                 'R.S. Aggarwal',              'Competitive Exams',             'S. Chand',        '2024','978-9352534029', 8),
    ('General Knowledge 2024',                  'Manohar Pandey',             'General Knowledge',             'Arihant',         '2024','978-9325298521', 5),
    ('English Grammar in Use',                  'Raymond Murphy',             'English Literature',            'Cambridge',       '5th', '978-1108457651', 4),
]


class Command(BaseCommand):
    help = 'Seed categories, books, and issue records into the Library module'

    def handle(self, *args, **kwargs):
        students = list(Student.objects.filter(status='active'))
        faculties = list(Faculty.objects.filter(status='active'))

        # ── 1. Categories ─────────────────────────────────────────────────
        self.stdout.write('Creating book categories...')
        cat_map = {}
        for name in CATEGORIES:
            obj, created = BookCategory.objects.get_or_create(name=name)
            cat_map[name] = obj
            self.stdout.write(f'  {"[New]" if created else "[Skip]"} {name}')

        # ── 2. Books ──────────────────────────────────────────────────────
        self.stdout.write('\nCreating books...')
        book_objs = []
        rack_counter = 1
        for title, author, cat_name, publisher, edition, isbn, copies in BOOKS:
            cat = cat_map.get(cat_name)
            obj, created = Book.objects.get_or_create(
                isbn=isbn,
                defaults={
                    'title':            title,
                    'author':           author,
                    'category':         cat,
                    'publisher':        publisher,
                    'edition':          edition,
                    'total_copies':     copies,
                    'available_copies': copies,
                    'rack_number':      f'R{rack_counter:02d}',
                    'status':           'available',
                },
            )
            book_objs.append(obj)
            if created:
                rack_counter += 1
                self.stdout.write(f'  [New] {title} — {author} ({copies} copies)')

        # ── 3. Issue records ──────────────────────────────────────────────
        self.stdout.write('\nCreating book issue records...')
        issued_count   = 0
        returned_count = 0
        overdue_count  = 0

        # Build member pool from students + faculty
        members = []
        for s in students:
            members.append({
                'name': f'{s.first_name} {s.last_name}',
                'id':   s.register_number,
                'type': 'student',
            })
        for f in faculties:
            members.append({
                'name': f'{f.first_name} {f.last_name}',
                'id':   f.email,
                'type': 'faculty',
            })

        if not members:
            self.stdout.write(self.style.WARNING('No members found to issue books to.'))
            return

        today = date.today()

        # Returned issues (past 6 months)
        for _ in range(60):
            book   = random.choice(book_objs)
            member = random.choice(members)
            issue_date  = today - timedelta(days=random.randint(30, 180))
            due_date    = issue_date + timedelta(days=14)
            return_date = due_date + timedelta(days=random.randint(-5, 10))
            fine = max(0, (return_date - due_date).days) * 5 if return_date > due_date else 0
            BookIssue.objects.create(
                book        = book,
                member_name = member['name'],
                member_type = member['type'],
                member_id   = member['id'],
                issue_date  = issue_date,
                due_date    = due_date,
                return_date = return_date,
                fine_amount = fine,
                status      = 'returned',
            )
            returned_count += 1

        # Active issued books
        for book in random.sample(book_objs, min(20, len(book_objs))):
            if book.available_copies < 1:
                continue
            member     = random.choice(members)
            issue_date = today - timedelta(days=random.randint(1, 10))
            due_date   = issue_date + timedelta(days=14)
            BookIssue.objects.create(
                book        = book,
                member_name = member['name'],
                member_type = member['type'],
                member_id   = member['id'],
                issue_date  = issue_date,
                due_date    = due_date,
                status      = 'issued',
            )
            book.available_copies = max(0, book.available_copies - 1)
            if book.available_copies == 0:
                book.status = 'issued'
            book.save()
            issued_count += 1

        # Overdue books
        for book in random.sample(book_objs, min(8, len(book_objs))):
            if book.available_copies < 1:
                continue
            member     = random.choice(members)
            issue_date = today - timedelta(days=random.randint(20, 40))
            due_date   = issue_date + timedelta(days=14)
            BookIssue.objects.create(
                book        = book,
                member_name = member['name'],
                member_type = member['type'],
                member_id   = member['id'],
                issue_date  = issue_date,
                due_date    = due_date,
                fine_amount = (today - due_date).days * 5,
                status      = 'overdue',
            )
            book.available_copies = max(0, book.available_copies - 1)
            if book.available_copies == 0:
                book.status = 'issued'
            book.save()
            overdue_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nDone! {len(book_objs)} books, {returned_count} returned, '
            f'{issued_count} active issues, {overdue_count} overdue.'
        ))
