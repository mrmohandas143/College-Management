from django.core.management.base import BaseCommand
from django.utils import timezone
from fees.models import Fee, FineRule

class Command(BaseCommand):
    help = 'Automatically updates fee statuses to overdue and calculates fines daily'

    def handle(self, *args, **options):
        today = timezone.now().date()
        self.stdout.write(f"Running fee status update for {today}...")

        # 1. Identify all pending fees that are now past due
        pending_overdue = Fee.objects.filter(
            status='pending',
            due_date__lt=today
        )
        
        count = pending_overdue.update(status='overdue')
        self.stdout.write(self.style.SUCCESS(f"Marked {count} fees as OVERDUE"))

        # 2. Apply Fine Rules to all overdue fees
        overdue_fees = Fee.objects.filter(status='overdue')
        active_rule = FineRule.objects.filter(is_active=True).first()

        if not active_rule:
            self.stdout.write(self.style.WARNING("No active FineRule found. Skipping fine calculation."))
            return

        applied_fines = 0
        for fee in overdue_fees:
            days_late = (today - fee.due_date).days
            
            if days_late > active_rule.grace_days:
                # Calculate fine logic
                calculated_fine = active_rule.flat_fine + (
                    active_rule.fine_per_day * (days_late - active_rule.grace_days)
                )

                # Apply max fine cap if it exists
                if active_rule.max_fine and calculated_fine > active_rule.max_fine:
                    calculated_fine = active_rule.max_fine

                # Only update if the fine has actually increased
                if fee.fine_amount != calculated_fine:
                    fee.fine_amount = calculated_fine
                    fee.save()
                    applied_fines += 1

        self.stdout.write(self.style.SUCCESS(f"Recalculated fines for {applied_fines} overdue fees."))
        self.stdout.write(self.style.SUCCESS("Process completed successfully."))