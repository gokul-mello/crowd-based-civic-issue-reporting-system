import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { HiOutlineChartPie, HiOutlineTrendingUp, HiOutlineShieldCheck } from 'react-icons/hi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/authority/analytics');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-500 text-sm font-medium">Synthesizing municipal intelligence charts...</p>
      </div>
    );
  }

  // 1. Chart by Category
  const categoryLabels = (data.byCategory || []).map((c) => c._id);
  const categoryCounts = (data.byCategory || []).map((c) => c.count);
  const categoryVotes = (data.byCategory || []).map((c) => c.totalVotes);

  const categoryBarData = {
    labels: categoryLabels,
    datasets: [
      {
        label: 'Total Complaints',
        data: categoryCounts,
        backgroundColor: '#0c8fe8',
        borderRadius: 8
      },
      {
        label: 'Community Votes Received',
        data: categoryVotes,
        backgroundColor: '#14b8a6',
        borderRadius: 8
      }
    ]
  };

  // 2. Chart by Status (Pie)
  const statusLabels = (data.byStatus || []).map((s) => s._id);
  const statusCounts = (data.byStatus || []).map((s) => s.count);

  const statusPieData = {
    labels: statusLabels,
    datasets: [
      {
        data: statusCounts,
        backgroundColor: [
          '#60a5fa', // Submitted
          '#fbbf24', // Under Review
          '#c084fc', // Assigned
          '#818cf8', // In Progress
          '#34d399', // Resolved
          '#f87171'  // Rejected
        ]
      }
    ]
  };

  // 3. Priority Breakdown
  const priorityLabels = (data.byPriority || []).map((p) => p._id);
  const priorityCounts = (data.byPriority || []).map((p) => p.count);

  const priorityData = {
    labels: priorityLabels,
    datasets: [
      {
        label: 'Complaints',
        data: priorityCounts,
        backgroundColor: ['#e11d48', '#f59e0b', '#3b82f6', '#64748b'],
        borderRadius: 8
      }
    ]
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Civic Intelligence & Redressal Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Quantitative metrics on municipal issue categories, resolution rates, and civic engagement.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category breakdown */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <HiOutlineTrendingUp className="w-5 h-5 text-primary-700" />
            <h3 className="text-base font-bold text-slate-900">Complaints & Votes by Category</h3>
          </div>
          <div className="h-72">
            <Bar
              data={categoryBarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } }
              }}
            />
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <HiOutlineChartPie className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900">Complaint Lifecycle Status Distribution</h3>
          </div>
          <div className="h-72 flex justify-center">
            <Pie
              data={statusPieData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right' } }
              }}
            />
          </div>
        </div>

        {/* Priority distribution */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2">
            <HiOutlineShieldCheck className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-bold text-slate-900">Urgency & Risk Classification Index</h3>
          </div>
          <div className="h-64">
            <Bar
              data={priorityData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
