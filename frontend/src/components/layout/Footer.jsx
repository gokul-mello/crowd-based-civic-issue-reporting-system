import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineShieldCheck, HiOutlineExternalLink } from 'react-icons/hi';

export const Footer = () => {
  return (
    <footer className="bg-primary-950 text-slate-300 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-primary-950 font-bold">
                <HiOutlineShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">CivicConnect</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Empowering communities to report, elevate, and track local civic infrastructure issues with AI-assisted clarity and verified democratic voting.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Portals</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/complaints" className="hover:text-teal-400 transition-colors">
                  Public Complaints Feed
                </Link>
              </li>
              <li>
                <Link to="/report" className="hover:text-teal-400 transition-colors">
                  Submit New Grievance
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-teal-400 transition-colors">
                  Citizen Login
                </Link>
              </li>
              <li>
                <Link to="/authority/login" className="hover:text-teal-400 transition-colors">
                  Government Authority Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Civic Categories */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Issue Categories</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Roads, Pavements & Potholes</li>
              <li>Sanitation & Garbage Accumulation</li>
              <li>Drinking Water & Distribution Leaks</li>
              <li>Streetlights & Hazardous Electrical Poles</li>
              <li>Drainage Overflow & Sewage Networks</li>
            </ul>
          </div>

          {/* Government Compliance */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Official Verification</h4>
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="font-semibold text-teal-400 block">CivicConnect Prototype v1.0</span>
              <p>Certified for College Capstone Project Demonstration. RESTful Mongoose backend with multi-factor scoring.</p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} CivicConnect. All civic grievances handled in accordance with local municipality redressal guidelines.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Charter</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Grievance Redressal</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
