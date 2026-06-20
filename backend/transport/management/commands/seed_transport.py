import random
from datetime import date
from django.core.management.base import BaseCommand
from students.models import Student
from transport.models import Route, Vehicle, TransportAllotment

ROUTES = [
    {
        'name': 'Route 1 — North Chennai',
        'start_point': 'College Campus',
        'end_point': 'Ambattur',
        'distance_km': 18.5,
        'stops': 'College Gate,Anna Nagar,Koyambedu,Arumbakkam,Villivakkam,Ambattur',
        'fare': 800,
    },
    {
        'name': 'Route 2 — South Chennai',
        'start_point': 'College Campus',
        'end_point': 'Tambaram',
        'distance_km': 22.0,
        'stops': 'College Gate,Guindy,St. Thomas Mount,Chromepet,Tambaram',
        'fare': 900,
    },
    {
        'name': 'Route 3 — West Chennai',
        'start_point': 'College Campus',
        'end_point': 'Porur',
        'distance_km': 14.0,
        'stops': 'College Gate,Vadapalani,Virugambakkam,Valasaravakkam,Porur',
        'fare': 700,
    },
    {
        'name': 'Route 4 — East Chennai',
        'start_point': 'College Campus',
        'end_point': 'Sholinganallur',
        'distance_km': 20.0,
        'stops': 'College Gate,Adyar,Thiruvanmiyur,Perungudi,Sholinganallur',
        'fare': 850,
    },
    {
        'name': 'Route 5 — Central Chennai',
        'start_point': 'College Campus',
        'end_point': 'Perambur',
        'distance_km': 12.5,
        'stops': 'College Gate,Egmore,Perambur,Kolathur,Perambur',
        'fare': 650,
    },
]

# (reg_number, type, capacity, driver_name, driver_phone)
VEHICLES = [
    ('TN01AB1001', 'Bus',     48, 'Murugan R',   '9876501001'),
    ('TN01AB1002', 'Bus',     48, 'Selvam K',    '9876501002'),
    ('TN01AB1003', 'Bus',     40, 'Rajan P',     '9876501003'),
    ('TN01AB1004', 'Bus',     40, 'Kannan S',    '9876501004'),
    ('TN01AB1005', 'Bus',     48, 'Venkat M',    '9876501005'),
    ('TN01AB1006', 'Minibus', 20, 'Suresh D',    '9876501006'),
    ('TN01AB1007', 'Minibus', 20, 'Prakash N',   '9876501007'),
    ('TN01AB1008', 'Van',     12, 'Dinesh A',    '9876501008'),
]


class Command(BaseCommand):
    help = 'Seed routes, vehicles, and student allotments into the Transport module'

    def handle(self, *args, **kwargs):
        students = list(Student.objects.filter(status='active'))
        if not students:
            self.stdout.write(self.style.ERROR('No active students found.'))
            return

        # ── 1. Create routes ──────────────────────────────────────────────
        self.stdout.write('Creating routes...')
        route_objs = []
        for r in ROUTES:
            obj, created = Route.objects.get_or_create(
                name=r['name'], defaults={k: v for k, v in r.items() if k != 'name'}
            )
            route_objs.append(obj)
            self.stdout.write(f'  {"[New]" if created else "[Skip]"} {obj.name}')

        # ── 2. Create vehicles, distribute across routes ──────────────────
        self.stdout.write('\nCreating vehicles...')
        vehicle_objs = []
        for i, (reg, vtype, cap, driver, phone) in enumerate(VEHICLES):
            route = route_objs[i % len(route_objs)]
            obj, created = Vehicle.objects.get_or_create(
                reg_number=reg,
                defaults={
                    'vehicle_type': vtype,
                    'capacity':     cap,
                    'driver_name':  driver,
                    'driver_phone': phone,
                    'route':        route,
                    'status':       'active',
                },
            )
            vehicle_objs.append(obj)
            self.stdout.write(f'  {"[New]" if created else "[Skip]"} {reg} — {driver} — {route.name}')

        # ── 3. Allot ~50% of students to transport ────────────────────────
        already = set(
            TransportAllotment.objects.filter(is_active=True).values_list('student_id', flat=True)
        )
        eligible = [s for s in students if s.register_number not in already]
        to_allot = random.sample(eligible, int(len(eligible) * 0.50))

        self.stdout.write(f'\nAllotting {len(to_allot)} students to transport...')
        created_count = 0
        valid_from = date(2024, 6, 1)
        valid_to   = date(2025, 3, 31)

        for student in to_allot:
            route   = random.choice(route_objs)
            stops   = [s.strip() for s in route.stops.split(',') if s.strip()]
            stop    = random.choice(stops[1:]) if len(stops) > 1 else stops[0]
            vehicle = random.choice([v for v in vehicle_objs if v.route_id == route.id] or vehicle_objs)

            TransportAllotment.objects.create(
                student_name  = f'{student.first_name} {student.last_name}',
                student_id    = student.register_number,
                route         = route,
                vehicle       = vehicle,
                boarding_stop = stop,
                valid_from    = valid_from,
                valid_to      = valid_to,
                is_active     = True,
            )
            created_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nDone! {len(route_objs)} routes, {len(vehicle_objs)} vehicles, {created_count} allotments created.'
        ))
