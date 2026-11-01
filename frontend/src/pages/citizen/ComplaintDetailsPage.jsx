import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { LocationPickerMap } from '../../components/complaints/LocationPickerMap';
import {
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineThumbUp,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineSparkles,
  HiOutlineOfficeBuilding,
  HiOutlineUser,
  HiOutlineClock
} from 'react-icons/hi';

export const ComplaintDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');

  const fetchComplaint = async () => {
    try {
      const res = await api.get(`/complaints/${id}`);
      if (res.data.success) {
        setComplaint(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Complaint not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleVote = async () => {
    if (!user) {
      alert('Please sign in as a citizen to support this complaint.');
      return;
    }
    setVoting(true);
    try {
      if (complaint.hasVoted) {
        await api.delete(`/complaints/${complaint._id}/vote`);
      } else {
        await api.post(`/complaints/${complaint._id}/vote`);
      }
      fetchComplaint();
    } catch (err) {
      alert(err.response?.data?.message || 'Vote operation failed');
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-500 text-sm font-medium">Loading complaint record...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-10 border border-slate-200">
          <HiOutlineExclamationCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Complaint Not Found</h2>
          <p className="text-sm text-slate-500 mt-1">{error || 'Invalid complaint identifier.'}</p>
          <Link
            to="/complaints"
            className="inline-block mt-4 px-4 py-2 bg-primary-700 text-white rounded-xl text-xs font-bold"
          >
            Back to Public Feed
          </Link>
        </div>
      </div>
    );
  }

  const {
    complaintId,
    professionalTitle,
    professionalDescription,
    originalDescription,
    category,
    area,
    location,
    latitude,
    longitude,
    status,
    priorityLevel,
    priorityScore,
    priorityReason,
    voteCount = 0,
    hasVoted,
    imageUrls = [],
    departmentId,
    assignedAuthorityId,
    authorityRemarks,
    rejectionReason,
    resolutionNotes,
    resolutionEvidence = [],
    history = [],
    createdAt,
    resolvedAt
  } = complaint;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner / Heading */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black text-primary-800 bg-primary-50 px-3 py-1 rounded-lg border border-primary-100">
              {complaintId}
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800">
              {category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                priorityLevel === 'Critical'
                  ? 'bg-rose-600 text-white'
                  : priorityLevel === 'High'
                  ? 'bg-amber-500 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {priorityLevel} Priority ({priorityScore} pts)
            </span>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
              Status: {status}
            </span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-snug">
          {professionalTitle}
        </h1>

        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <HiOutlineLocationMarker className="w-4 h-4 text-slate-400" />
            <span>{area} • {location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HiOutlineCalendar className="w-4 h-4 text-slate-400" />
            <span>Reported on {new Date(createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main 2-Column Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI-Generated Grievance vs Original Comparison */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                  <HiOutlineSparkles className="w-4 h-4 text-teal-600" />
                  Official Citizen-Approved Petition
                </span>
                <span className="text-[10px] bg-teal-50 text-teal-700 font-semibold px-2 py-0.5 rounded">
                  AI Formatted
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 text-slate-800 text-sm leading-relaxed whitespace-pre-line">
                {professionalDescription}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Original Everyday Citizen Submission
              </span>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs italic">
                "{originalDescription}"
              </div>
            </div>

            {/* Photo Evidence */}
            {imageUrls && imageUrls.length > 0 && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                  Photographic Evidence
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {imageUrls.map((url, idx) => (
                    <div key={idx} className="h-48 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img
                        src={url.startsWith('/uploads') ? `http://localhost:5000${url}` : url}
                        alt="Evidence"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Map Location */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <HiOutlineLocationMarker className="w-4 h-4 text-primary-700" />
              Precise Geographic Location
            </h3>
            <p className="text-xs text-slate-500">{location} ({area})</p>
            <LocationPickerMap
              latitude={latitude || 28.6139}
              longitude={longitude || 77.2090}
              readOnly={true}
              zoom={14}
            />
          </div>

          {/* Audit Trail / Lifecycle History */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HiOutlineClock className="w-5 h-5 text-slate-500" />
              Redressal Lifecycle & Audit History
            </h3>

            <div className="space-y-4 pt-2">
              {history.map((h, i) => (
                <div key={i} className="flex gap-4 items-start relative pb-4 border-l-2 border-slate-200 pl-4 ml-2">
                  <div className="w-3 h-3 rounded-full bg-primary-600 absolute -left-[7px] top-1"></div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{h.actionType}</span>
                      {h.newStatus && (
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                          → {h.newStatus}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">{h.remarks}</p>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(h.createdAt).toLocaleString()} by {h.changedBy?.name || 'Municipal Official'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Voting & Department Triage */}
        <div className="space-y-6">
          {/* Voting Action Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Community Endorsements
            </span>
            <div className="text-4xl font-black text-slate-900">
              {voteCount}
            </div>
            <p className="text-xs text-slate-500">
              Community votes elevate municipal prioritization. Each citizen account can cast one verified vote.
            </p>

            <button
              onClick={handleVote}
              disabled={voting || ['Resolved', 'Rejected'].includes(status)}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                hasVoted
                  ? 'bg-teal-600 text-white hover:bg-teal-700'
                  : 'bg-primary-700 text-white hover:bg-primary-800'
              } ${['Resolved', 'Rejected'].includes(status) ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <HiOutlineThumbUp className="w-5 h-5" />
              <span>{hasVoted ? 'Supported (Click to Withdraw)' : 'Support this Grievance'}</span>
            </button>
          </div>

          {/* Department and Officials Assignment */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Municipal Triage Details
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <HiOutlineOfficeBuilding className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-500 block">Assigned Department</span>
                  <span className="font-bold text-slate-900">
                    {departmentId ? departmentId.name : 'Awaiting Department Routing'}
                  </span>
                </div>
              </div>

              {assignedAuthorityId && (
                <div className="flex items-start gap-2.5">
                  <HiOutlineUser className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-500 block">Investigating Official</span>
                    <span className="font-bold text-slate-900">
                      {assignedAuthorityId.name} ({assignedAuthorityId.designation || 'Field Officer'})
                    </span>
                  </div>
                </div>
              )}

              {authorityRemarks && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                  <span className="font-bold block mb-1">Authority Remarks:</span>
                  <p>{authorityRemarks}</p>
                </div>
              )}

              {resolutionNotes && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                  <span className="font-bold block mb-1">Resolution Summary:</span>
                  <p>{resolutionNotes}</p>
                  {resolvedAt && (
                    <span className="text-[10px] text-emerald-700 block mt-1">
                      Resolved on: {new Date(resolvedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              {rejectionReason && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900">
                  <span className="font-bold block mb-1">Rejection Reason:</span>
                  <p>{rejectionReason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Priority Explanation Card */}
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 text-xs text-slate-600 space-y-2">
            <span className="font-bold text-slate-800 block">Priority Scoring Explanation</span>
            <p className="leading-relaxed">{priorityReason}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
