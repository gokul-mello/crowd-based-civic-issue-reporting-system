from django.conf import settings
from django.db import models
from django.urls import reverse
from .services import priority

CATEGORIES = [("roads", "Roads & potholes"), ("water", "Water supply"), ("electricity", "Electricity"),
              ("sanitation", "Sanitation & waste"), ("drainage", "Drainage & sewage"),
              ("streetlight", "Street lights"), ("other", "Other")]
STATUSES = [("pending", "Pending"), ("in_progress", "In progress"),
            ("resolved", "Resolved"), ("rejected", "Rejected")]
LEVELS = [("low", "Low"), ("medium", "Medium"), ("high", "High"), ("critical", "Critical")]


class Department(models.Model):
    name = models.CharField(max_length=120, unique=True)
    description = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.name


class Complaint(models.Model):
    citizen = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="complaints")
    title = models.CharField(max_length=150)
    original_text = models.TextField(help_text="Your complaint in everyday language")
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORIES, default="other")
    address = models.CharField(max_length=255)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    image = models.ImageField(upload_to="complaints/", blank=True, null=True)
    ai_source = models.CharField(max_length=12, default="manual")

    status = models.CharField(max_length=12, choices=STATUSES, default="pending")
    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL)
    votes_count = models.PositiveIntegerField(default=0)
    priority_score = models.PositiveSmallIntegerField(default=0)
    priority_level = models.CharField(max_length=10, choices=LEVELS, default="low")
    override_level = models.CharField(max_length=10, choices=LEVELS, blank=True)
    override_reason = models.TextField(blank=True)
    resolution_note = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-priority_score", "-created_at"]

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse("detail", args=[self.pk])

    def recalculate(self):
        self.priority_score = priority.score(self)
        self.priority_level = self.override_level or priority.level(self.priority_score)

    def save(self, *a, **k):
        self.recalculate()
        super().save(*a, **k)


class Vote(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name="votes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "complaint"], name="one_vote_per_user")]


class ComplaintHistory(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name="history")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=200)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    complaint = models.ForeignKey(Complaint, null=True, on_delete=models.CASCADE)
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
