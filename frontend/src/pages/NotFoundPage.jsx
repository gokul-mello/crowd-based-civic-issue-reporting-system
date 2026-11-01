import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineEmojiSad } from 'react-icons/hi';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 text-center">
      <div className="space-y-4 max-w-md">
        <HiOutlineEmojiSad className="w-16 h-16 text-slate-400 mx-auto" />
        <h1 className="text-4xl font-black text-slate-900">404 - Page Not Found</h1>
        <p className="text-sm text-slate-500">
          The civic resource or portal route you requested does not exist or has been relocated.
        </p>
        <Link
          to="/"
          className="inline-block mt-4 px-6 py-3 bg-primary-700 text-white rounded-xl text-sm font-bold shadow hover:bg-primary-800 transition-colors"
        >
          Return to CivicConnect Home
        </Link>
      </div>
    </div>
  );
};
