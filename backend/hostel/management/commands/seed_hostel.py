import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from students.models import Student
from hostel.models import HostelBlock, Room, HostelAllotment, HostelFee

# Blocks: (name, gender, warden, floors, rooms_per_floor, room_type, capacity)
BLOCKS = [
    ('Alpha Block',   'male',   'Mr. Suresh Kumar',   3, 10, 'double', 2),
    ('Beta Block',    'male',   'Mr. Rajesh Nair',    3, 10, 'double', 2),
    ('Gamma Block',   'female', 'Mrs. Priya Sharma',  3, 10, 'double', 2),
    ('Delta Block',   'female', 'Mrs. Kavya Reddy',   2,  8, 'double', 2),
]

MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December']

FEE_AMOUNT = 4500


class Command(BaseCommand):
    help = 'Seed student data into the Hostel module'

    def handle(self, *args, **kwargs):
        students = list(Student.objects.filter(status='active'))
        if not students:
            self.stdout.write(self.style.ERROR('No active students found. Run seed_data first.'))
            return

        # ── 1. Create blocks & rooms ──────────────────────────────────────
        self.stdout.write('Creating hostel blocks and rooms...')
        all_rooms = {'male': [], 'female': []}

        for bname, gender, warden, floors, rpf, rtype, cap in BLOCKS:
            block, _ = HostelBlock.objects.get_or_create(
                name=bname,
                defaults={'gender': gender, 'warden': warden, 'capacity': floors * rpf * cap},
            )
            for floor in range(1, floors + 1):
                for r in range(1, rpf + 1):
                    room_no = f'{floor}{r:02d}'
                    room, _ = Room.objects.get_or_create(
                        block=block, room_number=room_no,
                        defaults={
                            'room_type': rtype,
                            'capacity':  cap,
                            'occupied':  0,
                            'floor':     floor,
                            'status':    'available',
                        },
                    )
                    all_rooms[gender].append(room)

        self.stdout.write(self.style.SUCCESS(
            f'  Male rooms: {len(all_rooms["male"])}  |  Female rooms: {len(all_rooms["female"])}'
        ))

        # ── 2. Split students by gender, pick ~60% for hostel ────────────
        male_students   = [s for s in students if s.gender == 'male']
        female_students = [s for s in students if s.gender == 'female']

        already_allotted = set(
            HostelAllotment.objects.filter(status='active').values_list('student_id', flat=True)
        )

        def pick(pool, pct=0.60):
            eligible = [s for s in pool if s.register_number not in already_allotted]
            return random.sample(eligible, min(int(len(eligible) * pct), len(eligible)))

        to_allot_male   = pick(male_students)
        to_allot_female = pick(female_students)

        self.stdout.write(f'Allotting {len(to_allot_male)} male, {len(to_allot_female)} female students...')

        # ── 3. Allot students to rooms ────────────────────────────────────
        allotment_date = date(2024, 6, 1)
        created = 0

        def allot_batch(student_list, rooms):
            nonlocal created
            room_idx = 0
            for student in student_list:
                # Advance to next room with space
                while room_idx < len(rooms) and rooms[room_idx].occupied >= rooms[room_idx].capacity:
                    room_idx += 1
                if room_idx >= len(rooms):
                    self.stdout.write(self.style.WARNING('  No more rooms available!'))
                    break

                room = rooms[room_idx]
                HostelAllotment.objects.create(
                    room           = room,
                    student_name   = f'{student.first_name} {student.last_name}',
                    student_id     = student.register_number,
                    contact        = student.phone,
                    allotment_date = allotment_date,
                    status         = 'active',
                )
                room.occupied += 1
                if room.occupied >= room.capacity:
                    room.status = 'occupied'
                room.save()
                created += 1

        allot_batch(to_allot_male,   all_rooms['male'])
        allot_batch(to_allot_female, all_rooms['female'])

        # ── 4. Generate fee records (Jun–Nov 2024) for each allotment ────
        self.stdout.write('Generating hostel fee records...')
        fee_months = MONTHS[5:11]   # June to November
        fees_created = 0

        for allotment in HostelAllotment.objects.filter(status='active'):
            if allotment.fees.exists():
                continue
            for i, month in enumerate(fee_months):
                due = date(2024, 6 + i, 5)
                paid = i < 4   # first 4 months paid, rest pending
                HostelFee.objects.create(
                    allotment = allotment,
                    month     = f'{month} 2024',
                    amount    = FEE_AMOUNT,
                    due_date  = due,
                    paid_date = due - timedelta(days=random.randint(1, 4)) if paid else None,
                    status    = 'paid' if paid else 'pending',
                )
                fees_created += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nDone! {created} allotments created, {fees_created} fee records generated.'
        ))
