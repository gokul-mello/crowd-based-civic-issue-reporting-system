import React from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineChevronRight,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineThumbUp,
  HiOutlineClock
} from 'react-icons/hi';

const getStatusBadge = (status) => {
  switch (status) {
    case 'Submitted':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Under Review':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Assigned':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'In Progress':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'Resolved':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Rejected':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

const getPriorityBadge = (level) => {
  switch (level) {
    case 'Critical':
      return 'bg-rose-600 text-white font-bold';
    case 'High':
      return 'bg-amber-500 text-white font-semibold';
    case 'Medium':
      return 'bg-blue-500 text-white font-medium';
    default:
      return 'bg-slate-500 text-white font-medium';
  }
};

export const ComplaintCard = ({ complaint, onVote, isVoting = false }) => {
  const {
    _id,
    complaintId,
    professionalTitle,
    professionalDescription,
    category,
    area,
    location,
    status,
    priorityLevel,
    voteCount = 0,
    hasVoted = false,
    imageUrls = [],
    createdAt
  } = complaint;

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const displayImage = imageUrls && imageUrls.length > 0 ? imageUrls[0] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group">
      {/* Top Banner & Media */}
      <div>
        {displayImage && (
          <div className="relative h-44 w-full overflow-hidden bg-slate-100">
            <img
              src={displayImage.startsWith('/uploads') ? `http://localhost:5000${displayImage}` : displayImage}
              alt={professionalTitle}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full uppercase tracking-wider ${getPriorityBadge(priorityLevel)}`}>
                {priorityLevel} Priority
              </span>
            </div>
          </div>
        )}

        <div className="p-5">
          {/* Header metadata */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {complaintId}
            </span>
            <div className="flex items-center gap-2">
              {!displayImage && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${getPriorityBadge(priorityLevel)}`}>
                  {priorityLevel}
                </span>
              )}
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(status)}`}>
                {status}
              </span>
            </div>
          </div>

          {/* Title */}
          <Link to={`/complaints/${_id}`}>
            <h3 className="text-base font-bold text-slate-900 line-clamp-2 hover:text-primary-700 transition-colors">
              {professionalTitle}
            </h3>
          </Link>

          {/* Description snippet */}
          <p className="mt-2 text-sm text-slate-600 line-clamp-3 leading-relaxed">
            {professionalDescription}
          </p>

          {/* Category & Location */}
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                {category}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <HiOutlineLocationMarker className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{area || location}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <HiOutlineCalendar className="w-4 h-4 shrink-0" />
              <span>Reported on {formattedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
        {/* Support Vote Button */}
        <button
          onClick={() => onVote && onVote(_id, hasVoted)}
          disabled={isVoting || ['Resolved', 'Rejected'].includes(status)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            hasVoted
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white border border-slate-300 text-slate-700 hover:border-teal-500 hover:text-teal-700'
          } ${['Resolved', 'Rejected'].includes(status) ? 'opacity-60 cursor-not-allowed' : ''}`}
          title={hasVoted ? 'Click to withdraw community vote' : 'Support this civic grievance'}
        >
          <HiOutlineThumbUp className={`w-4 h-4 ${hasVoted ? 'text-white' : 'text-slate-500'}`} />
          <span>{hasVoted ? 'Supported' : 'Support'}</span>
          <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[11px] ${hasVoted ? 'bg-teal-700' : 'bg-slate-100 text-slate-700'}`}>
            {voteCount}
          </span>
        </button>

        <Link
          to={`/complaints/${_id}`}
          className="flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-900 group-hover:translate-x-0.5 transition-all"
        >
          <span>View Details</span>
          <HiOutlineChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
