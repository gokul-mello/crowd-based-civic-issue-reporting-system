import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineSparkles,
  HiOutlineThumbUp,
  HiOutlineShieldCheck,
  HiOutlineArrowRight,
  HiOutlineLocationMarker,
  HiOutlineChartBar,
  HiOutlineChatAlt2,
  HiOutlineUsers
} from 'react-icons/hi';
import api from '../services/api';
import { ComplaintCard } from '../components/complaints/ComplaintCard';

export const LandingPage = () => {
  const [featuredComplaints, setFeaturedComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopComplaints = async () => {
      try {
        const res = await api.get('/complaints?sortBy=votes&order=desc&limit=3');
        if (res.data.success) {
          setFeaturedComplaints(res.data.data || []);
        }
      } catch (err) {
        console.warn('Could not load featured complaints:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTopComplaints();
  }, []);

  return (
    <div className="space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-primary-50/50 via-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider shadow-sm">
                <HiOutlineSparkles className="w-4 h-4 text-teal-600 animate-pulse" />
                <span>Next-Gen Civic Redressal • AI Powered</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.15]">
                Turn Everyday Grievances into <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-700 via-primary-600 to-teal-500">Official Municipal Action</span>.
              </h1>

              <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
                Describe potholes, garbage, or water leaks in simple, everyday language. Our integrated AI rewrites your submission into a formal civic petition, while community voting prioritizes what matters most to your neighborhood.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-2">
                <Link
                  to="/report"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/25 transition-all text-center flex items-center justify-center gap-2"
                >
                  <span>Report a Civic Issue</span>
                  <HiOutlineArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/complaints"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition-all text-center"
                >
                  Browse Community Feed
                </Link>
              </div>

              {/* Quick trust metrics */}
              <div className="pt-6 grid grid-cols-3 gap-6 border-t border-slate-200/80 max-w-lg text-left">
                <div>
                  <span className="text-2xl font-black text-primary-950 block">100%</span>
                  <span className="text-xs text-slate-500">Transparent Lifecycle</span>
                </div>
                <div>
                  <span className="text-2xl font-black text-teal-600 block">AI Triage</span>
                  <span className="text-xs text-slate-500">Formal Grievances</span>
                </div>
                <div>
                  <span className="text-2xl font-black text-slate-900 block">Democracy</span>
                  <span className="text-xs text-slate-500">Community Backed</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Mockup / Hero Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 relative">
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-primary-600 to-teal-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow">
                  Live AI Transformation
                </div>

                <div className="space-y-4">
                  {/* Citizen Input Mock */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      🗣️ Citizen Everyday Input
                    </span>
                    <p className="text-xs text-slate-700 italic">
                      "The road near our bus stop has many big holes. It is difficult for vehicles to pass, and accidents may happen."
                    </p>
                  </div>

                  {/* AI Transformation arrow */}
                  <div className="flex items-center justify-center gap-2 text-teal-600 text-xs font-bold py-1">
                    <HiOutlineSparkles className="w-4 h-4 animate-spin text-teal-500" />
                    <span>CivicConnect AI Engine rewrites & categorizes...</span>
                  </div>

                  {/* Formalized Output Mock */}
                  <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                        📄 Formal Municipal Grievance
                      </span>
                      <span className="text-[10px] bg-teal-200/80 text-teal-900 font-bold px-2 py-0.5 rounded">
                        High Priority
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Request for Urgent Road Surface Repair & Pothole Rectification
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      "To the Concerned Municipal Authority: I wish to bring to attention the deteriorated carriageway near the bus stop. Multiple deep potholes pose imminent safety hazards to commuters. Prompt inspection and resurfacing are requested."
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-teal-200 text-[11px] font-semibold text-slate-700">
                      <span className="text-teal-700">Category: Roads & Potholes</span>
                      <span className="flex items-center gap-1 text-primary-700">
                        <HiOutlineThumbUp className="w-3.5 h-3.5" /> 150+ Community Votes
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Step Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl font-black text-slate-950 tracking-tight">How CivicConnect Works</h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Bridging the gap between active citizens and responsible municipal authorities through transparency and intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-800 font-black text-lg flex items-center justify-center mb-6">
              1
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Report in Plain Words</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Snap a picture and describe the civic issue simply. Our AI transforms it into an official petition with appropriate department routing and severity indicators.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 font-black text-lg flex items-center justify-center mb-6">
              2
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Community Upvoting</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Neighbors and residents support the complaint with verified single-click voting. The automated multi-factor scoring system elevates high-impact problems to the top.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 font-black text-lg flex items-center justify-center mb-6">
              3
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Authority Resolution</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Government authorities inspect, assign work crews, provide status updates, and post verified resolution evidence directly onto the citizen's audit trail.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Community Complaints */}
      {featuredComplaints.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md">
                Civic Priorities
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-2">
                Top Supported Community Issues
              </h2>
            </div>
            <Link
              to="/complaints"
              className="text-sm font-bold text-primary-700 hover:text-primary-800 flex items-center gap-1"
            >
              <span>Explore all community reports</span>
              <HiOutlineArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredComplaints.map((item) => (
              <ComplaintCard key={item._id} complaint={item} />
            ))}
          </div>
        </section>
      )}

      {/* Two Portal Gateway Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-primary-950 via-primary-900 to-slate-900 rounded-3xl p-8 sm:p-14 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-950 px-3 py-1 rounded-full border border-teal-800">
                Segregated Workspaces
              </span>
              <h3 className="text-3xl font-black tracking-tight mt-3">
                Built for Citizens & Municipal Administrators
              </h3>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Whether you are a resident demanding road repairs or an executive engineer scheduling asphalt equipment, CivicConnect provides tailored interfaces for rapid civic progress.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Link
                to="/register"
                className="px-6 py-3.5 rounded-xl font-bold text-slate-950 bg-white hover:bg-slate-100 transition-colors text-center text-sm shadow-md"
              >
                Join as Citizen
              </Link>
              <Link
                to="/authority/login"
                className="px-6 py-3.5 rounded-xl font-bold text-teal-300 bg-teal-950 hover:bg-teal-900 border border-teal-700 transition-colors text-center text-sm"
              >
                Government Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
