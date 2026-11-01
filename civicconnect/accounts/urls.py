from django.urls import path
from . import views

urlpatterns = [
    path("register/", views.register, name="register"),
    path("login/", views.login_view, name="login"),
    path("authority/login/", views.authority_login, name="authority_login"),
    path("logout/", views.logout_view, name="logout"),
]
