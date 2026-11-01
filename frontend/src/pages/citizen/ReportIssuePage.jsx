import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { LocationPickerMap } from '../../components/complaints/LocationPickerMap';
import {
  HiOutlineSparkles,
  HiOutlineLocationMarker,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlinePhotograph,
  HiOutlineThumbUp,
  HiOutlineExternalLink
} from 'react-icons/hi';

const CATEGORIES = [
  'Roads & Potholes',
  'Garbage & Sanitation',
  'Water Supply & Leakage',
  'Streetlights & Electrical',
  'Drainage & Sewage',
  'Public Property & Parks',
  'Traffic & Safety',
  'Other'
];

export const ReportIssuePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Citizen input state
  const [formData, setFormData] = useState({
    titleHint: '',
    originalDescription: '',
    category: 'Roads & Potholes',
    area: '',
    location: '',
    latitude: 28.6139,
    longitude: 77.2090,
  });

  const [images, setImages] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  // AI Generation State
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(null);
  const [aiError, setAiError] = useState('');

  // Editable fields for citizen approval
  const [approvedTitle, setApprovedTitle] = useState('');
  const [approvedDescription, setApprovedDescription] = useState('');
  const [suggestedUrgency, setSuggestedUrgency] = useState('Medium');

  // Duplicate warning state
  const [duplicateCheckLoading, setDuplicateCheckLoading] = useState(false);
  const [duplicateList, setDuplicateList] = useState([]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationPick = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImages([file]);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 1. AI Transformation Trigger
  const handleGenerateAiComplaint = async () => {
    if (!formData.originalDescription || formData.originalDescription.trim().length < 10) {
      setAiError('Please enter at least 10 characters describing the civic problem.');
      return;
    }

    setAiError('');
    setIsGeneratingAi(true);

    try {
      const res = await api.post('/complaints/generate-ai', {
        originalDescription: formData.originalDescription,
        category: formData.category,
        area: formData.area
      });

      if (res.data.success) {
        const data = res.data.data;
        setAiGenerated(data);
        setApprovedTitle(data.professionalTitle);
        setApprovedDescription(data.professionalDescription);
        setSuggestedUrgency(data.suggestedUrgency || 'Medium');

        // Check for duplicates in background
        checkNearbyDuplicates();
      }
    } catch (err) {
      setAiError(err.response?.data?.message || 'Failed to generate AI complaint. Please try again.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // 2. Check for Duplicate Reports
  const checkNearbyDuplicates = async () => {
    setDuplicateCheckLoading(true);
    try {
      const res = await api.post('/complaints/check-duplicates', {
        category: formData.category,
        area: formData.area,
        originalDescription: formData.originalDescription,
        latitude: formData.latitude,
        longitude: formData.longitude
      });
      if (res.data.success) {
        setDuplicateList(res.data.data || []);
      }
    } catch (err) {
      // silent fail
    } finally {
      setDuplicateCheckLoading(false);
    }
  };

  // 3. Final Submission after Citizen Approval
  const handleSubmitFinalComplaint = async (e) => {
    e.preventDefault();

    if (!approvedTitle || !approvedDescription) {
      setSubmitError('Please generate and review the professional complaint before submitting.');
      return;
    }

    if (!formData.area || !formData.location) {
      setSubmitError('Please specify the area/locality and address landmark.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const payload = new FormData();
      payload.append('originalDescription', formData.originalDescription);
      payload.append('professionalTitle', approvedTitle);
      payload.append('professionalDescription', approvedDescription);
      payload.append('category', formData.category);
      payload.append('area', formData.area);
      payload.append('location', formData.location);
      payload.append('latitude', formData.latitude || '');
      payload.append('longitude', formData.longitude || '');
      payload.append('suggestedUrgency', suggestedUrgency);

      if (images.length > 0) {
        images.forEach((img) => payload.append('images', img));
      }

      const res = await api.post('/complaints', payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        setSubmitSuccess(res.data.data);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to lodge complaint. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-xl space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <HiOutlineCheckCircle className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Civic Grievance Submitted Successfully!
          </h2>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-left">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-500">Tracking Reference ID:</span>
              <span className="font-mono font-bold text-primary-800 text-sm">{submitSuccess.complaintId}</span>
            </div>
            <div className="text-xs">
              <span className="font-semibold text-slate-500">Official Title:</span>
              <p className="font-bold text-slate-800 mt-0.5">{submitSuccess.professionalTitle}</p>
            </div>
            <div className="text-xs">
              <span className="font-semibold text-slate-500">Locality:</span>
              <span className="ml-1 text-slate-700">{submitSuccess.area}</span>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Your complaint is now active on the public community feed. Other residents can support it, and municipal authorities have been notified for initial review.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={() => navigate(`/complaints/${submitSuccess._id}`)}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-primary-700 hover:bg-primary-800 transition-colors shadow-sm text-sm"
            >
              Track Complaint Details
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-sm"
            >
              Go to Citizen Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-950 tracking-tight">Report a Civic Problem</h1>
        <p className="text-sm text-slate-600 mt-1">
          Describe the problem in everyday language. Our AI transforms it into an official municipal petition for you to review and approve before submission.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
        {/* Step 1: Citizen's Raw Everyday Input */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
              1
            </div>
            <h2 className="text-base font-bold text-slate-900">Your Description (Everyday Language)</h2>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Issue Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Describe the problem in simple words *
            </label>
            <textarea
              name="originalDescription"
              rows={4}
              required
              value={formData.originalDescription}
              onChange={handleInputChange}
              placeholder="e.g. The road near our bus stop has many big holes. It is difficult for vehicles to pass, and accidents may happen, especially during rainy days."
              className="w-full p-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm leading-relaxed"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Be natural. Mention what is broken and why it is a nuisance or hazard.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Area / Locality *
              </label>
              <input
                type="text"
                name="area"
                required
                value={formData.area}
                onChange={handleInputChange}
                placeholder="e.g. Sector 4, Bus Terminal Area"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Address / Landmark *
              </label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g. Opposite Main Bus Stand, Sector 4 Ring Road"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
          </div>

          {/* AI Trigger Button */}
          {aiError && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <HiOutlineExclamationCircle className="w-4 h-4 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerateAiComplaint}
            disabled={isGeneratingAi}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-primary-800 via-primary-700 to-teal-600 hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-60"
          >
            <HiOutlineSparkles className={`w-5 h-5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
            <span>
              {isGeneratingAi
                ? 'Synthesizing Formal Complaint with AI...'
                : 'Generate Professional Complaint with AI'}
            </span>
          </button>
        </section>

        {/* Potential Duplicate Check Alert */}
        {duplicateList.length > 0 && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <HiOutlineExclamationCircle className="w-5 h-5 text-amber-600" />
              <span>Similar complaints found in this locality!</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              We noticed existing complaints reported nearby that match your problem. Supporting an existing complaint with your community vote increases its priority score faster:
            </p>
            <div className="space-y-2">
              {duplicateList.map(({ complaint, similarityScore, reason }) => (
                <div
                  key={complaint._id}
                  className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">{complaint.professionalTitle}</span>
                    <span className="text-[11px] text-slate-500">
                      ID: {complaint.complaintId} • Status: {complaint.status} • {reason}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      {complaint.voteCount} votes
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/complaints/${complaint._id}`)}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px]"
                    >
                      View & Vote
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Citizen Review & Edit of AI-Generated Content */}
        {aiGenerated && (
          <section className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-800 font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Review & Approve AI-Drafted Grievance
                </h2>
              </div>
              <span className="text-[11px] bg-teal-100 text-teal-800 font-bold px-2.5 py-0.5 rounded-full">
                {aiGenerated.aiProvider}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs">
              💡 <strong>Citizen Confirmation Required:</strong> You can edit the title or description below before final submission. We ensure no false facts are added.
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Formal Complaint Title (Editable)
              </label>
              <input
                type="text"
                required
                value={approvedTitle}
                onChange={(e) => setApprovedTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Official Letter / Grievance Text (Editable)
              </label>
              <textarea
                rows={6}
                required
                value={approvedDescription}
                onChange={(e) => setApprovedDescription(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm leading-relaxed text-slate-800"
              />
            </div>

            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Suggested Urgency
                </label>
                <select
                  value={suggestedUrgency}
                  onChange={(e) => setSuggestedUrgency(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {/* Step 3: Map Location & Photo Evidence */}
        <section className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center">
              3
            </div>
            <h2 className="text-base font-bold text-slate-900">Pin Location & Attach Evidence</h2>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <HiOutlineLocationMarker className="w-4 h-4 text-teal-600" />
              <span>Interactive Leaflet Map (Click to pin)</span>
            </label>
            <LocationPickerMap
              latitude={formData.latitude}
              longitude={formData.longitude}
              onLocationSelect={handleLocationPick}
            />
            <div className="mt-2 text-xs text-slate-500 flex gap-4 font-mono">
              <span>Latitude: {formData.latitude?.toFixed(4) || 'None'}</span>
              <span>Longitude: {formData.longitude?.toFixed(4) || 'None'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Attach Photographic Evidence (Optional)
            </label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors">
                <HiOutlinePhotograph className="w-5 h-5 text-slate-500" />
                <span>Choose Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {imagePreview && (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-300">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Final Submission Block */}
        {submitError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
            <HiOutlineExclamationCircle className="w-5 h-5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleSubmitFinalComplaint}
            disabled={isSubmitting || !aiGenerated}
            className="w-full py-4 px-6 rounded-2xl font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 text-base disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              'Submitting Official Grievance to Municipal Database...'
            ) : !aiGenerated ? (
              'Please generate & review AI complaint first'
            ) : (
              'Approve & Lodge Civic Grievance'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
