import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF8] text-[#26332D]">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

