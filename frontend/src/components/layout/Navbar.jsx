import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineClipboardList,
  HiOutlinePlusCircle,
  HiOutlineUserCircle,
  HiOutlineBell,
  HiOutlineLogout,
  HiOutlineShieldCheck,
  HiOutlineMenu,
  HiOutlineX
} from 'react-icons/hi';
import api from '../../services/api';

export const Navbar = () => {
  const { user, isAuthority, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchUnread = async () => {
        try {
          const res = await api.get('/notifications');
          if (res.data.success) {
            setUnreadCount(res.data.unreadCount || 0);
          }
        } catch (err) {
          // silent fail
        }
      };
      fetchUnread();
      const interval = setInterval(fetchUnread, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-950 via-primary-700 to-teal-500 flex items-center justify-center text-white shadow-md shadow-primary-950/20">
              <HiOutlineShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-primary-950 block leading-tight">
                Civic<span className="text-teal-600">Connect</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
                Gov Tech & Community AI
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') ? 'text-primary-700 bg-primary-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>
            <Link
              to="/complaints"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/complaints') ? 'text-primary-700 bg-primary-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Public Feed
            </Link>

            {user && !isAuthority && (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/dashboard') ? 'text-primary-700 bg-primary-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  My Dashboard
                </Link>
                <Link
                  to="/report"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/report')
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                  }`}
                >
                  <HiOutlinePlusCircle className="w-4 h-4" />
                  Report Issue
                </Link>
              </>
            )}

            {user && isAuthority && (
              <Link
                to="/authority/dashboard"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive('/authority/dashboard')
                    ? 'bg-primary-950 text-white'
                    : 'bg-primary-50 text-primary-900 hover:bg-primary-100'
                }`}
              >
                Authority Portal
              </Link>
            )}
          </nav>

          {/* User actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/notifications"
                  className="relative p-2 text-slate-600 hover:text-primary-700 hover:bg-slate-100 rounded-full transition-colors"
                  title="Notifications"
                >
                  <HiOutlineBell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors"
                >
                  <HiOutlineUserCircle className="w-5 h-5 text-slate-500" />
                  <span className="max-w-[120px] truncate">{user.name}</span>
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      isAuthority
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <HiOutlineLogout className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-primary-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Citizen Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-700 hover:bg-primary-800 rounded-lg shadow-sm transition-colors"
                >
                  Sign Up
                </Link>
                <Link
                  to="/authority/login"
                  className="ml-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors"
                >
                  Official Login
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <Link
                to="/notifications"
                className="relative p-2 text-slate-600"
              >
                <HiOutlineBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-slate-700"
          >
            Home
          </Link>
          <Link
            to="/complaints"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-slate-700"
          >
            Public Feed
          </Link>

          {user ? (
            <>
              {isAuthority ? (
                <Link
                  to="/authority/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-base font-medium text-primary-800"
                >
                  Authority Portal
                </Link>
              ) : (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-base font-medium text-slate-700"
                  >
                    My Dashboard
                  </Link>
                  <Link
                    to="/report"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-base font-semibold text-teal-700"
                  >
                    + Report Civic Issue
                  </Link>
                </>
              )}
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-slate-700"
              >
                My Profile
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left py-2 text-base font-medium text-rose-600"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2 text-center text-sm font-semibold bg-slate-100 text-slate-800 rounded-lg"
              >
                Citizen Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2 text-center text-sm font-semibold bg-primary-700 text-white rounded-lg"
              >
                Create Account
              </Link>
              <Link
                to="/authority/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2 text-center text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg"
              >
                Government Authority Portal
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
