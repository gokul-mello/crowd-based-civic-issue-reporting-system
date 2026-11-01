import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import {
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineOfficeBuilding,
  HiOutlineExclamationCircle,
  HiOutlineAdjustments,
  HiOutlineChevronRight
} from 'react-icons/hi';

export const AuthorityComplaintsPage = () => {
  const [searchParams] = useSearchParams();
  const preSelectedId = searchParams.get('selected');

  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState('All');
  const [category, setCategory] = useState('All');
  const [priority, setPriority] = useState('All');
  const [search, setSearch] = useState('');

  // Action Modal State
  const [actionType, setActionType] = useState(null); // 'STATUS' | 'ASSIGN' | 'PRIORITY'
  const [newStatus, setNewStatus] = useState('In Progress');
  const [remarks, setRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [newPriorityLevel, setNewPriorityLevel] = useState('High');
  const [priorityOverrideReason, setPriorityOverrideReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (status !== 'All') params.append('status', status);
      if (category !== 'All') params.append('category', category);
      if (priority !== 'All') params.append('priority', priority);
      if (search.trim()) params.append('search', search.trim());

      const [compRes, deptRes] = await Promise.all([
        api.get(`/authority/complaints?${params.toString()}`),
        api.get('/departments')
      ]);

      if (compRes.data.success) {
        setComplaints(compRes.data.data || []);
        if (preSelectedId) {
          const match = compRes.data.data.find((c) => c._id === preSelectedId);
          if (match) setSelectedComplaint(match);
        } else if (compRes.data.data.length > 0 && !selectedComplaint) {
          setSelectedComplaint(compRes.data.data[0]);
        }
      }

      if (deptRes.data.success) {
        setDepartments(deptRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load complaints table:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [status, category, priority]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionLoading(true);

    try {
      const payload = {
        status: newStatus,
        remarks,
        rejectionReason: newStatus === 'Rejected' ? rejectionReason : undefined,
        resolutionNotes: newStatus === 'Resolved' ? resolutionNotes : undefined
      };

      const res = await api.patch(
        `/authority/complaints/${selectedComplaint._id}/status`,
        payload
      );

      if (res.data.success) {
        setActionType(null);
        fetchData();
        setSelectedComplaint(res.data.data);
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignDepartment = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionLoading(true);

    try {
      const res = await api.patch(
        `/authority/complaints/${selectedComplaint._id}/assign`,
        {
          departmentId: selectedDeptId,
          remarks
        }
      );

      if (res.data.success) {
        setActionType(null);
        fetchData();
        setSelectedComplaint(res.data.data);
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to assign department');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOverridePriority = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionLoading(true);

    try {
      const res = await api.patch(
        `/authority/complaints/${selectedComplaint._id}/priority`,
        {
          priorityLevel: newPriorityLevel,
          priorityReason: priorityOverrideReason
        }
      );

      if (res.data.success) {
        setActionType(null);
        fetchData();
        setSelectedComplaint(res.data.data);
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to override priority');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Grievance Management & Triage Console
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review complaints, compare with locality, assign engineering teams, and document resolutions.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center justify-between text-xs">
        <div className="flex flex-1 min-w-[240px] items-center gap-2 border border-slate-300 rounded-xl px-3 py-1.5">
          <HiOutlineSearch className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, title, locality..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
            className="w-full text-xs focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="p-2 border border-slate-300 rounded-xl font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="p-2 border border-slate-300 rounded-xl font-medium"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <button
            onClick={fetchData}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Dual Panel Layout: List Table & Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Complaint List (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-xs text-slate-700 flex justify-between">
            <span>Complaints ({complaints.length})</span>
            <span>Priority / Votes</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[750px] overflow-y-auto">
            {complaints.map((c) => (
              <div
                key={c._id}
                onClick={() => setSelectedComplaint(c)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedComplaint?._id === c._id
                    ? 'bg-primary-50/80 border-l-4 border-primary-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {c.complaintId}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.priorityLevel === 'Critical'
                        ? 'bg-rose-600 text-white'
                        : c.priorityLevel === 'High'
                        ? 'bg-amber-500 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {c.priorityLevel} ({c.voteCount} votes)
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                  {c.professionalTitle}
                </h4>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                  <span className="truncate max-w-[150px]">{c.area}</span>
                  <span className="font-semibold text-slate-700">{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Detailed Inspector & Actions (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          {selectedComplaint ? (
            <>
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="font-mono text-xs font-bold text-primary-800">
                    {selectedComplaint.complaintId}
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-1">
                    {selectedComplaint.professionalTitle}
                  </h2>
                  <span className="text-xs text-slate-500">
                    📍 {selectedComplaint.location} ({selectedComplaint.area})
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setNewStatus(selectedComplaint.status);
                      setRemarks('');
                      setActionType('STATUS');
                    }}
                    className="px-3 py-1.5 bg-primary-700 hover:bg-primary-800 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    Update Status
                  </button>

                  <button
                    onClick={() => {
                      setSelectedDeptId(selectedComplaint.departmentId?._id || '');
                      setRemarks('');
                      setActionType('ASSIGN');
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    Assign Dept
                  </button>

                  <button
                    onClick={() => {
                      setNewPriorityLevel(selectedComplaint.priorityLevel);
                      setPriorityOverrideReason('');
                      setActionType('PRIORITY');
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    Override Priority
                  </button>
                </div>
              </div>

              {/* Status & Priority Badge Strip */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Status</span>
                  <span className="font-bold text-slate-900">{selectedComplaint.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Priority</span>
                  <span className="font-bold text-slate-900">
                    {selectedComplaint.priorityLevel} ({selectedComplaint.priorityScore} pts)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Community Support</span>
                  <span className="font-bold text-teal-700">{selectedComplaint.voteCount} citizens</span>
                </div>
              </div>

              {/* AI Description vs Citizen Submission */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Citizen-Approved Formal Description
                </span>
                <p className="text-xs text-slate-700 leading-relaxed bg-teal-50/60 p-4 rounded-xl border border-teal-100 whitespace-pre-line">
                  {selectedComplaint.professionalDescription}
                </p>

                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block pt-1">
                  Original Citizen Input
                </span>
                <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                  "{selectedComplaint.originalDescription}"
                </p>
              </div>

              {/* Department Assignment Info */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-700 block">Assigned Department</span>
                <p className="text-slate-900 font-semibold">
                  {selectedComplaint.departmentId
                    ? `${selectedComplaint.departmentId.name} (${selectedComplaint.departmentId.code})`
                    : 'Not assigned to any municipal department yet'}
                </p>
                {selectedComplaint.authorityRemarks && (
                  <p className="text-slate-600 pt-1">
                    <strong>Official Remarks:</strong> {selectedComplaint.authorityRemarks}
                  </p>
                )}
                {selectedComplaint.resolutionNotes && (
                  <div className="mt-2 p-2.5 bg-emerald-100/70 text-emerald-900 rounded-lg">
                    <strong>Resolution Record:</strong> {selectedComplaint.resolutionNotes}
                  </div>
                )}
              </div>

              {/* Action Modals */}
              {actionType === 'STATUS' && (
                <form onSubmit={handleUpdateStatus} className="p-5 rounded-2xl bg-primary-50 border border-primary-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-primary-950">Update Complaint Status</h3>
                    <button type="button" onClick={() => setActionType(null)} className="text-slate-500">
                      <HiOutlineX className="w-5 h-5" />
                    </button>
                  </div>

                  {actionError && <p className="text-xs text-rose-600">{actionError}</p>}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">New Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl text-xs font-medium"
                    >
                      <option value="Under Review">Under Review</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  {newStatus === 'Rejected' && (
                    <div>
                      <label className="block text-xs font-bold text-rose-700 mb-1">
                        Mandatory Rejection Reason *
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="State clear reasons why this complaint cannot be addressed..."
                        className="w-full p-2 border border-rose-300 rounded-xl text-xs"
                      />
                    </div>
                  )}

                  {newStatus === 'Resolved' && (
                    <div>
                      <label className="block text-xs font-bold text-emerald-800 mb-1">
                        Mandatory Resolution Notes *
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Detail the remedial actions taken by the field team..."
                        className="w-full p-2 border border-emerald-300 rounded-xl text-xs"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Authority Remarks</label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Add public official log entry..."
                      className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-2 bg-primary-700 text-white font-bold rounded-xl text-xs hover:bg-primary-800"
                  >
                    {actionLoading ? 'Saving Update...' : 'Commit Status Change'}
                  </button>
                </form>
              )}

              {actionType === 'ASSIGN' && (
                <form onSubmit={handleAssignDepartment} className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white">Assign to Municipal Department</h3>
                    <button type="button" onClick={() => setActionType(null)} className="text-slate-400">
                      <HiOutlineX className="w-5 h-5" />
                    </button>
                  </div>

                  {actionError && <p className="text-xs text-rose-400">{actionError}</p>}

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Select Department</label>
                    <select
                      required
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    >
                      <option value="">-- Choose Department --</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Work Order Remarks</label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="e.g. Dispatched to Ward 4 field inspector"
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-2 bg-teal-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-teal-300"
                  >
                    {actionLoading ? 'Assigning...' : 'Dispatch Department Assignment'}
                  </button>
                </form>
              )}

              {actionType === 'PRIORITY' && (
                <form onSubmit={handleOverridePriority} className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-amber-950">Administrative Priority Override</h3>
                    <button type="button" onClick={() => setActionType(null)} className="text-slate-500">
                      <HiOutlineX className="w-5 h-5" />
                    </button>
                  </div>

                  {actionError && <p className="text-xs text-rose-600">{actionError}</p>}

                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">Priority Classification</label>
                    <select
                      value={newPriorityLevel}
                      onChange={(e) => setNewPriorityLevel(e.target.value)}
                      className="w-full p-2 border border-amber-300 rounded-xl text-xs font-medium"
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">
                      Recorded Justification *
                    </label>
                    <input
                      type="text"
                      required
                      value={priorityOverrideReason}
                      onChange={(e) => setPriorityOverrideReason(e.target.value)}
                      placeholder="e.g. Ground inspection revealed live wire hazard near school"
                      className="w-full p-2 border border-amber-300 rounded-xl text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-2 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700"
                  >
                    {actionLoading ? 'Overriding...' : 'Save Priority Override'}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-slate-400 text-sm">
              Select a complaint on the left to review and take official action.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
