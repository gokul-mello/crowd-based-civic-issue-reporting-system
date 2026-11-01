from django.contrib import admin
from .models import Complaint, ComplaintHistory, Department, Notification, Vote

admin.site.register([Department, Vote, ComplaintHistory, Notification])

@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "status", "priority_level", "priority_score", "votes_count")
    list_filter = ("status", "category", "priority_level")
    search_fields = ("title", "address")
