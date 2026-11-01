import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { ComplaintCard } from '../../components/complaints/ComplaintCard';
import {
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlinePlusCircle,
  HiOutlineExclamationCircle,
  HiOutlineSearch
} from 'react-icons/hi';

export const CitizenDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSubmitted: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });

  const [myComplaints, setMyComplaints] = useState([]);
  const [recentCommunityComplaints, setRecentCommunityComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch citizen's personal complaints
      const myRes = await api.get('/complaints/my');
      if (myRes.data.success) {
        setStats(myRes.data.stats);
        setMyComplaints(myRes.data.data || []);
      }

      // 2. Fetch recent community complaints
      const commRes = await api.get('/complaints?limit=6&sortBy=createdAt&order=desc');
      if (commRes.data.success) {
        setRecentCommunityComplaints(commRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching citizen dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVote = async (complaintId, hasVoted) => {
    try {
      if (hasVoted) {
        await api.delete(`/complaints/${complaintId}/vote`);
      } else {
        await api.post(`/complaints/${complaintId}/vote`);
      }
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Vote operation failed');
    }
  };

  const filteredMyComplaints = myComplaints.filter((c) => {
    const matchesCat = filterCategory === 'All' || c.category === filterCategory;
    const matchesSearch =
      searchTerm === '' ||
      c.professionalTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.complaintId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Welcome & Action Banner */}
      <div className="bg-gradient-to-r from-primary-950 via-primary-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-teal-400 bg-teal-950 px-3 py-1 rounded-full border border-teal-800">
            Citizen Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Track grievances you've submitted, support local initiatives, and monitor municipal progress in your sector.
          </p>
        </div>
        <Link
          to="/report"
          className="shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 transition-all shadow-lg shadow-teal-500/20 text-sm"
        >
          <HiOutlinePlusCircle className="w-5 h-5" />
          <span>Report a Civic Issue</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-2xl font-bold">
            <HiOutlineClipboardList className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Submitted</span>
            <span className="text-2xl font-black text-slate-900">{stats.totalSubmitted}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-2xl font-bold">
            <HiOutlineClock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pending Review</span>
            <span className="text-2xl font-black text-slate-900">{stats.pending}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-2xl font-bold">
            <HiOutlineRefresh className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">In Progress</span>
            <span className="text-2xl font-black text-slate-900">{stats.inProgress}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl font-bold">
            <HiOutlineCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Resolved Issues</span>
            <span className="text-2xl font-black text-slate-900">{stats.resolved}</span>
          </div>
        </div>
      </div>

      {/* Section 1: My Submitted Complaints */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">My Lodged Complaints</h2>
            <p className="text-xs text-slate-500">Grievances registered by your account</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <HiOutlineSearch className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by ID or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="py-2 px-3 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="All">All Categories</option>
              <option value="Roads & Potholes">Roads</option>
              <option value="Garbage & Sanitation">Garbage</option>
              <option value="Water Supply & Leakage">Water</option>
              <option value="Streetlights & Electrical">Streetlights</option>
              <option value="Drainage & Sewage">Drainage</option>
            </select>
          </div>
        </div>

        {filteredMyComplaints.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
            <HiOutlineClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No complaints registered yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              If there's an infrastructure problem in your area, use the AI reporter to submit a complaint in seconds.
            </p>
            <Link
              to="/report"
              className="inline-block mt-4 px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl hover:bg-teal-700"
            >
              + Report First Issue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMyComplaints.map((c) => (
              <ComplaintCard key={c._id} complaint={c} />
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Recent Community Issues to Support */}
      <div className="space-y-6 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recent Community Grievances</h2>
            <p className="text-xs text-slate-500">Support your neighbors by casting community votes</p>
          </div>
          <Link
            to="/complaints"
            className="text-xs font-bold text-primary-700 hover:text-primary-800"
          >
            View Full Community Feed →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentCommunityComplaints.map((c) => (
            <ComplaintCard
              key={c._id}
              complaint={c}
              onVote={handleVote}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
