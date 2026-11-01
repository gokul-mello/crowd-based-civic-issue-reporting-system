from django import forms
from django.contrib.auth.forms import AuthenticationForm
from .models import User

TW = "w-full rounded-md border border-slate-300 px-3 py-2 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"


class RegisterForm(forms.ModelForm):
    password = forms.CharField(min_length=8, widget=forms.PasswordInput, help_text="At least 8 characters")

    class Meta:
        model = User
        fields = ("name", "email", "phone", "password")

    def __init__(self, *a, **k):
        super().__init__(*a, **k)
        for f in self.fields.values():
            f.widget.attrs["class"] = TW

    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = User.CITIZEN
        user.set_password(self.cleaned_data["password"])
        if commit:
            user.save()
        return user


class LoginForm(AuthenticationForm):
    def __init__(self, *a, **k):
        super().__init__(*a, **k)
        self.fields["username"].label = "Email"
        for f in self.fields.values():
            f.widget.attrs["class"] = TW
