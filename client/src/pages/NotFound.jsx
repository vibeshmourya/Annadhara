import React from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-3xl bg-[#EAF4EE] text-[#2E7D5B] flex items-center justify-center mb-4">
        <HeartHandshake className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-[#26332D]">404</h1>
      <h2 className="text-lg font-bold text-[#26332D] mt-2">Page Not Found</h2>
      <p className="text-xs text-[#718078] max-w-sm mt-1 mb-6">
        The link you followed may be broken or the food donation listing may have been completed.
      </p>
      <Link
        to="/"
        className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43] flex items-center space-x-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
};

