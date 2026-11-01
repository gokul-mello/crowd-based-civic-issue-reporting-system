import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  HiOutlineClipboardList,
  HiOutlineExclamation,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineEye,
  HiOutlineArrowRight
} from 'react-icons/hi';

export const AuthorityDashboard = () => {
  const [stats, setStats] = useState({
    totalComplaints: 0,
    newSubmitted: 0,
    pendingReview: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
    highPriority: 0
  });

  const [urgentComplaints, setUrgentComplaints] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/authority/dashboard');
      if (res.data.success) {
        setStats(res.data.stats);
        setUrgentComplaints(res.data.urgentComplaints || []);
        setRecentActivity(res.data.recentActivity || []);
      }
    } catch (err) {
      console.error('Failed to load authority dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Banner */}
      <div className="bg-slate-950 text-white rounded-3xl p-8 border border-slate-800 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-[10px] uppercase font-black tracking-widest text-teal-400 bg-teal-950 px-3 py-1 rounded-full border border-teal-800">
            Administrative Command
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-2">
            Municipal Authority Headquarters
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Real-time civic grievance triaging, department allocation, and verified resolution management.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/authority/complaints"
            className="px-5 py-3 rounded-xl font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 transition-colors text-xs shadow-md"
          >
            Manage All Complaints
          </Link>
          <Link
            to="/authority/analytics"
            className="px-5 py-3 rounded-xl font-bold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors text-xs"
          >
            Analytics & Reports
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Total Reports</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.totalComplaints}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block">New Submissions</span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">{stats.newSubmitted}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block">Critical / High</span>
          <span className="text-2xl font-black text-rose-700 mt-1 block">{stats.highPriority}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 block">Assigned / Queue</span>
          <span className="text-2xl font-black text-purple-700 mt-1 block">{stats.assigned}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block">In Progress</span>
          <span className="text-2xl font-black text-indigo-700 mt-1 block">{stats.inProgress}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">Resolved</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats.resolved}</span>
        </div>
      </div>

      {/* Urgent Issues requiring immediate attention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HiOutlineExclamation className="w-5 h-5 text-rose-600" />
              Urgent Community Grievances (Top Priority Score)
            </h2>
            <Link
              to="/authority/complaints"
              className="text-xs font-bold text-primary-700 hover:underline"
            >
              View Full Table →
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {urgentComplaints.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No unresolved complaints pending.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {urgentComplaints.map((item) => (
                  <div key={item._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {item.complaintId}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.priorityLevel === 'Critical'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {item.priorityLevel} ({item.priorityScore} pts)
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{item.professionalTitle}</h4>
                      <p className="text-xs text-slate-500">
                        📍 {item.area} • {item.voteCount} community endorsements
                      </p>
                    </div>

                    <Link
                      to={`/authority/complaints?selected=${item._id}`}
                      className="shrink-0 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-center"
                    >
                      <HiOutlineEye className="w-4 h-4" />
                      <span>Investigate</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Administrative Audit Trail */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Recent Official Activity</h2>
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No recent actions recorded.</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((act, idx) => (
                  <div key={idx} className="text-xs pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{act.actionType}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5 line-clamp-1">{act.remarks || 'Status update logged'}</p>
                    <span className="text-[10px] text-teal-700 block mt-0.5">
                      By {act.changedBy?.name || 'Administrator'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
