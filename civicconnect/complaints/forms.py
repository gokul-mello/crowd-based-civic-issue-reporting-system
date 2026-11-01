from django import forms
from .models import Complaint, LEVELS, STATUSES, Department

TW = "w-full rounded-md border border-slate-300 px-3 py-2 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"


class ComplaintForm(forms.ModelForm):
    class Meta:
        model = Complaint
        fields = ("original_text", "title", "description", "category", "address", "latitude", "longitude", "image")
        widgets = {
            "original_text": forms.Textarea(attrs={"rows": 4, "placeholder": "e.g. The road near our bus stop has many big holes and two-wheelers keep slipping."}),
            "description": forms.Textarea(attrs={"rows": 8}),
            "latitude": forms.HiddenInput(), "longitude": forms.HiddenInput(),
        }

    def __init__(self, *a, **k):
        super().__init__(*a, **k)
        for n, f in self.fields.items():
            if n not in ("latitude", "longitude", "image"):
                f.widget.attrs["class"] = TW

    def clean_image(self):
        img = self.cleaned_data.get("image")
        if img and img.size > 5 * 1024 * 1024:
            raise forms.ValidationError("Image must be under 5 MB.")
        return img


class ManageForm(forms.Form):
    status = forms.ChoiceField(choices=STATUSES)
    department = forms.ModelChoiceField(Department.objects.all(), required=False)
    override_level = forms.ChoiceField(choices=[("", "Automatic")] + LEVELS, required=False)
    override_reason = forms.CharField(widget=forms.Textarea(attrs={"rows": 2}), required=False)
    resolution_note = forms.CharField(widget=forms.Textarea(attrs={"rows": 3}), required=False)
    rejection_reason = forms.CharField(widget=forms.Textarea(attrs={"rows": 3}), required=False)

    def __init__(self, *a, **k):
        super().__init__(*a, **k)
        for f in self.fields.values():
            f.widget.attrs["class"] = TW

    def clean(self):
        d = super().clean()
        if d.get("override_level") and not d.get("override_reason", "").strip():
            self.add_error("override_reason", "Give a reason when overriding priority.")
        if d.get("status") == "resolved" and not d.get("resolution_note", "").strip():
            self.add_error("resolution_note", "Resolution note is required to resolve a complaint.")
        if d.get("status") == "rejected" and not d.get("rejection_reason", "").strip():
            self.add_error("rejection_reason", "Rejection reason is required to reject a complaint.")
        return d
