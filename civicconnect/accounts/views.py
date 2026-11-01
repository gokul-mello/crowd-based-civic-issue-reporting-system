from django.contrib import messages
from django.contrib.auth import login, logout
from django.shortcuts import redirect, render
from .forms import LoginForm, RegisterForm


def register(request):
    form = RegisterForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = form.save()
        login(request, user)
        messages.success(request, "Welcome to CivicConnect!")
        return redirect("dashboard")
    return render(request, "accounts/register.html", {"form": form})


def _do_login(request, template, authority):
    form = LoginForm(request, data=request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = form.get_user()
        if user.is_authority != authority:
            form.add_error(None, "This account cannot use this portal.")
        else:
            login(request, user)
            return redirect("authority_dashboard" if authority else "dashboard")
    return render(request, template, {"form": form})


def login_view(request):
    return _do_login(request, "accounts/login.html", False)


def authority_login(request):
    return _do_login(request, "accounts/authority_login.html", True)


def logout_view(request):
    logout(request)
    return redirect("home")
