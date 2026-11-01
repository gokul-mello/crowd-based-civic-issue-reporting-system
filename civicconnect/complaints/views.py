import json
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from accounts.decorators import authority_required, citizen_required
from .forms import ComplaintForm, ManageForm
from .models import CATEGORIES, STATUSES, Complaint, ComplaintHistory, Notification, Vote
from .services import ai, duplicates, priority


def notify(user, complaint, message):
    Notification.objects.create(user=user, complaint=complaint, message=message)


def home(request):
    qs = Complaint.objects.all()
    q, cat, st = request.GET.get("q", ""), request.GET.get("category", ""), request.GET.get("status", "")
    if q:
        qs = qs.filter(Q(title__icontains=q) | Q(address__icontains=q))
    if cat:
        qs = qs.filter(category=cat)
    if st:
        qs = qs.filter(status=st)
    pins = [{"id": c.id, "title": c.title, "lat": c.latitude, "lng": c.longitude, "level": c.priority_level}
            for c in qs if c.latitude is not None]
    stats = {"total": Complaint.objects.count(),
             "resolved": Complaint.objects.filter(status="resolved").count(),
             "open": Complaint.objects.exclude(status__in=["resolved", "rejected"]).count()}
    return render(request, "complaints/home.html", {
        "complaints": qs[:30], "pins": pins, "stats": stats, "categories": CATEGORIES,
        "statuses": STATUSES, "q": q, "cat": cat, "st": st})


@citizen_required
def dashboard(request):
    mine = request.user.complaints.all()
    voted = Complaint.objects.filter(votes__user=request.user)
    return render(request, "complaints/dashboard.html", {"mine": mine, "voted": voted})


@citizen_required
def report(request):
    form = ComplaintForm(request.POST or None, request.FILES or None)
    if request.method == "POST" and form.is_valid():
        c = form.save(commit=False)
        c.citizen = request.user
        c.ai_source = request.POST.get("ai_source") or "manual"
        c.save()
        ComplaintHistory.objects.create(complaint=c, actor=request.user, action="Complaint submitted")
        notify(request.user, c, f"Your complaint “{c.title}” was submitted.")
        messages.success(request, "Complaint submitted.")
        return redirect(c)
    return render(request, "complaints/report.html", {"form": form})


@citizen_required
@require_POST
def ai_generate(request):
    data = json.loads(request.body or "{}")
    text = (data.get("text") or "").strip()
    if len(text) < 15:
        return JsonResponse({"error": "Please describe the issue in at least a sentence."}, status=400)
    address = data.get("address", "")
    result = ai.generate(text, address)
    lat, lng = data.get("latitude"), data.get("longitude")
    result["duplicates"] = duplicates.find_duplicates(
        text, result["category"],
        float(lat) if lat not in (None, "") else None, float(lng) if lng not in (None, "") else None)
    return JsonResponse(result)


def detail(request, pk):
    c = get_object_or_404(Complaint.objects.select_related("citizen", "department"), pk=pk)
    user = request.user
    ctx = {"c": c, "history": c.history.select_related("actor"), "breakdown": priority.breakdown(c),
           "has_voted": user.is_authenticated and c.votes.filter(user=user).exists()}
    if user.is_authenticated and user.is_authority:
        ctx["form"] = ManageForm(initial={
            "status": c.status, "department": c.department, "override_level": c.override_level,
            "override_reason": c.override_reason, "resolution_note": c.resolution_note,
            "rejection_reason": c.rejection_reason})
    return render(request, "complaints/detail.html", ctx)


@citizen_required
@require_POST
def toggle_vote(request, pk):
    c = get_object_or_404(Complaint, pk=pk)
    if c.citizen_id == request.user.id:
        messages.error(request, "You cannot vote on your own complaint.")
    else:
        vote, created = Vote.objects.get_or_create(user=request.user, complaint=c)
        if not created:
            vote.delete()
        c.votes_count = c.votes.count()
        c.save()
        messages.success(request, "Vote added." if created else "Vote withdrawn.")
    return redirect(c)


@authority_required
@require_POST
def manage(request, pk):
    c = get_object_or_404(Complaint, pk=pk)
    form = ManageForm(request.POST)
    if not form.is_valid():
        for errs in form.errors.values():
            for e in errs:
                messages.error(request, e)
        return redirect(c)
    d = form.cleaned_data
    changes = []
    if d["status"] != c.status:
        changes.append(f"Status: {c.get_status_display()} → {dict(STATUSES)[d['status']]}")
    if d["department"] != c.department:
        changes.append(f"Assigned to {d['department'] or 'no department'}")
    if d["override_level"] != c.override_level:
        changes.append(f"Priority override: {d['override_level'] or 'automatic'}")
    c.status, c.department = d["status"], d["department"]
    c.override_level, c.override_reason = d["override_level"], d["override_reason"]
    c.resolution_note, c.rejection_reason = d["resolution_note"], d["rejection_reason"]
    c.save()
    for ch in changes:
        ComplaintHistory.objects.create(
            complaint=c, actor=request.user, action=ch,
            note=d["resolution_note"] or d["rejection_reason"] or d["override_reason"])
    if changes:
        notify(c.citizen, c, f"Update on “{c.title}”: " + "; ".join(changes))
    messages.success(request, "Complaint updated.")
    return redirect(c)


@authority_required
def authority_dashboard(request):
    qs = Complaint.objects.select_related("department", "citizen")
    st, lvl, cat = request.GET.get("status", ""), request.GET.get("level", ""), request.GET.get("category", "")
    if st:
        qs = qs.filter(status=st)
    if lvl:
        qs = qs.filter(priority_level=lvl)
    if cat:
        qs = qs.filter(category=cat)
    return render(request, "authority/dashboard.html", {
        "complaints": qs, "statuses": STATUSES, "categories": CATEGORIES,
        "st": st, "lvl": lvl, "cat": cat,
        "pending": Complaint.objects.filter(status="pending").count(),
        "critical": Complaint.objects.filter(priority_level="critical").exclude(status__in=["resolved", "rejected"]).count()})


@authority_required
def analytics(request):
    def agg(field, choices):
        counts = dict(Complaint.objects.values_list(field).annotate(n=Count("id")))
        return {"labels": [l for _, l in choices], "data": [counts.get(k, 0) for k, _ in choices]}
    from .models import LEVELS
    data = {"category": agg("category", CATEGORIES), "status": agg("status", STATUSES),
            "priority": agg("priority_level", LEVELS)}
    return render(request, "authority/analytics.html", {"data": data})


@login_required
def notifications(request):
    items = list(request.user.notifications.select_related("complaint")[:50])
    request.user.notifications.filter(is_read=False).update(is_read=True)
    return render(request, "complaints/notifications.html", {"items": items})
