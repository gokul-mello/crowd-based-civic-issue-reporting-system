from functools import wraps
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied


def authority_required(view):
    @wraps(view)
    @login_required(login_url="authority_login")
    def wrapper(request, *a, **k):
        if not request.user.is_authority:
            raise PermissionDenied
        return view(request, *a, **k)
    return wrapper


def citizen_required(view):
    @wraps(view)
    @login_required
    def wrapper(request, *a, **k):
        if request.user.is_authority:
            raise PermissionDenied
        return view(request, *a, **k)
    return wrapper
