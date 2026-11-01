import os
from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = "Create (or reset) the government authority account from environment variables"

    def handle(self, *a, **k):
        email = os.getenv("AUTHORITY_SETUP_EMAIL", "admin@civicconnect.gov.in")
        pw = os.getenv("AUTHORITY_SETUP_PASSWORD", "Admin@Civic2026!")
        name = os.getenv("AUTHORITY_SETUP_NAME", "Municipal Chief Commissioner")
        user, _ = User.objects.get_or_create(email=email, defaults={"name": name})
        user.name, user.role, user.is_staff, user.is_superuser = name, User.AUTHORITY, True, True
        user.set_password(pw)
        user.save()
        self.stdout.write(self.style.SUCCESS(f"Authority ready: {email}"))
