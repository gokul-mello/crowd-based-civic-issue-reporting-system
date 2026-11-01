from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("Email is required")
        user = self.model(email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("role", "authority")
        return self.create_user(email, password, **extra)


class User(AbstractUser):
    CITIZEN, AUTHORITY = "citizen", "authority"
    ROLES = [(CITIZEN, "Citizen"), (AUTHORITY, "Authority")]

    username = None
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=10, choices=ROLES, default=CITIZEN)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]
    objects = UserManager()

    @property
    def is_authority(self):
        return self.role == self.AUTHORITY

    def __str__(self):
        return f"{self.name} <{self.email}>"
