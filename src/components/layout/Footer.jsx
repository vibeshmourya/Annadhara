import React from 'react';
import { HeartHandshake, ShieldCheck, Leaf, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-stone-200/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2E7D5B] text-white flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-[#26332D]">FoodBridge</span>
            </div>
            <p className="text-sm font-semibold text-[#2E7D5B]">Surplus Food. Shared Hope. Zero Waste.</p>
            <p className="text-sm text-[#718078] max-w-md leading-relaxed">
              FoodBridge connects restaurants, canteens, and food businesses with registered charities and community
              shelters to ensure wholesome surplus food nourishes people instead of ending up in landfills.
            </p>
          </div>

          {/* Platform Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#26332D] mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-[#718078]">
              <li>
                <Link to="/find-food" className="hover:text-[#2E7D5B] transition-colors">
                  Find Available Food
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#2E7D5B] transition-colors">
                  Register Organization
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#2E7D5B] transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#2E7D5B] transition-colors">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Safety & Trust */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#26332D] mb-3">Trust & Safety</h4>
            <div className="space-y-2.5 text-xs text-[#718078] leading-relaxed">
              <div className="flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#2E7D5B] mt-0.5 shrink-0" />
                <span>Verified recipient charities & food rescue protocols.</span>
              </div>
              <div className="flex items-start space-x-2">
                <Leaf className="w-4 h-4 text-[#2E7D5B] mt-0.5 shrink-0" />
                <span>Strict cold-chain and hot-holding declarations on every listing.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer & Safety Notice */}
        <div className="border-t border-stone-100 pt-6 text-xs text-[#718078] space-y-2">
          <p className="bg-[#F8FAF8] p-3 rounded-xl border border-stone-200/60">
            <strong>Food Safety Notice:</strong> FoodBridge is a community coordination platform. Participating donors
            and recipient organizations are responsible for complying with applicable local food handling, temperature
            control, and safety regulations. Never consume food that looks, smells, or feels compromised.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-2 text-[#718078]">
            <p>© {new Date().getFullYear()} FoodBridge Network. All rights reserved.</p>
            <p className="text-[11px] mt-1 sm:mt-0">Built with Node.js, Express, React, Tailwind, and Flutter.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

