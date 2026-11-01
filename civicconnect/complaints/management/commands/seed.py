import random
from datetime import timedelta
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import User
from complaints.models import Complaint, ComplaintHistory, Department, Vote

DEPTS = ["Roads & Highways", "Water Supply Board", "Electricity Board", "Solid Waste Management", "Drainage & Sewerage"]
CITIZENS = [("Aarav Sharma", "aarav.sharma@example.com"), ("Priya Nair", "priya.nair@example.com"),
            ("Karthik Raj", "karthik.raj@example.com"), ("Meena Iyer", "meena.iyer@example.com")]
# title, text, category, address, lat, lng, days_old
DATA = [
    ("Deep potholes near Gandhipuram bus stop", "Many big deep holes on the road near the bus stop, two-wheelers are slipping and there was an accident last week.", "roads", "Gandhipuram, Coimbatore", 11.0183, 76.9725, 9),
    ("Exposed live wire on RS Puram pole", "A live wire is hanging low from the electric pole near the park, children play nearby. Sparking when it rains.", "electricity", "RS Puram, Coimbatore", 11.0066, 76.9505, 4),
    ("Open drain overflowing at Peelamedu", "The drain beside the main road is overflowing with sewage and stagnant water, bad smell and mosquitoes.", "drainage", "Peelamedu, Coimbatore", 11.0262, 77.0276, 15),
    ("Garbage not collected for a week", "Garbage has not been collected for more than a week, bins are overflowing on the street.", "sanitation", "Saibaba Colony, Coimbatore", 11.0262, 76.9482, 7),
    ("Street lights not working on Avinashi Road", "Four street lights are off since Monday, the stretch is very dark at night.", "streetlight", "Avinashi Road, Coimbatore", 11.0204, 77.0010, 3),
    ("Water pipe leakage wasting drinking water", "Main water pipe is leaking near the school gate and water has been flowing for two days.", "water", "Singanallur, Coimbatore", 10.9990, 77.0290, 2),
]


class Command(BaseCommand):
    help = "Seed departments, demo citizens and sample complaints"

    def handle(self, *a, **k):
        call_command("create_authority")
        for n in DEPTS:
            Department.objects.get_or_create(name=n)
        users = []
        for name, email in CITIZENS:
            u, made = User.objects.get_or_create(email=email, defaults={"name": name})
            if made:
                u.set_password("Citizen@123"); u.save()
            users.append(u)
        if Complaint.objects.exists():
            self.stdout.write("Complaints already exist; skipping."); return
        for i, (title, text, cat, addr, lat, lng, age) in enumerate(DATA):
            owner = users[i % len(users)]
            c = Complaint.objects.create(citizen=owner, title=title, original_text=text, description=text,
                                         category=cat, address=addr, latitude=lat, longitude=lng, ai_source="seed")
            Complaint.objects.filter(pk=c.pk).update(created_at=timezone.now() - timedelta(days=age))
            c.refresh_from_db()
            for v in random.sample([u for u in users if u != owner], k=random.randint(0, 3)):
                Vote.objects.create(user=v, complaint=c)
            c.votes_count = c.votes.count(); c.save()
            ComplaintHistory.objects.create(complaint=c, actor=owner, action="Complaint submitted")
        self.stdout.write(self.style.SUCCESS("Seed complete. Citizen login: aarav.sharma@example.com / Citizen@123"))
