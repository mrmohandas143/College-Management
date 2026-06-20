from django.db.models.signals import post_save
from django.dispatch import receiver
from datetime import date, timedelta


@receiver(post_save, sender='students.Student')
def create_pending_fees(sender, instance, created, **kwargs):
    if not created:
        return
    from fees.models import Fee, FeeStructure
    structures = FeeStructure.objects.filter(is_active=True).filter(
        course=instance.course
    )
    if not structures.exists():
        structures = FeeStructure.objects.filter(is_active=True, course='')
    due_date = date.today() + timedelta(days=30)
    for s in structures:
        Fee.objects.get_or_create(
            student=instance,
            fee_type=s.fee_type,
            academic_year=s.academic_year,
            defaults=dict(
                fee_structure=s,
                amount=s.amount,
                due_date=due_date,
                status='pending',
            )
        )
