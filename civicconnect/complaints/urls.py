from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("report/", views.report, name="report"),
    path("api/ai-generate/", views.ai_generate, name="ai_generate"),
    path("complaints/<int:pk>/", views.detail, name="detail"),
    path("complaints/<int:pk>/vote/", views.toggle_vote, name="vote"),
    path("complaints/<int:pk>/manage/", views.manage, name="manage"),
    path("authority/", views.authority_dashboard, name="authority_dashboard"),
    path("authority/analytics/", views.analytics, name="analytics"),
    path("notifications/", views.notifications, name="notifications"),
]
