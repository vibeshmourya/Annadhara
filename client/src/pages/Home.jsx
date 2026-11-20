import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartHandshake,
  ShieldCheck,
  Truck,
  Building,
  ArrowRight,
  Package,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { donationApi } from '../api/endpoints';
import { DonationCard } from '../components/donations/DonationCard';
import { useAuth } from '../context/AuthContext';
import { FOOD_SAFETY_DISCLAIMER } from '../constants/india';

export const Home = () => {
  const { isAuthenticated, isDonor } = useAuth();
  const [recentDonations, setRecentDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await donationApi.getAll({ limit: 3 });
        if (res.data.success) {
          setRecentDonations(res.data.data.slice(0, 3));
        }
      } catch (err) {
        console.warn('Could not load recent donations', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#EAF4EE]/80 via-[#F8FAF8] to-[#F8FAF8] pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 border-b border-stone-200/50">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-[#2E7D5B]/20 text-[#205B43] text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#2E7D5B] animate-pulse" />
            <span>🇮🇳 India Surplus Food Rescue & Distribution Network</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-[#26332D] tracking-tight leading-[1.15]">
            Share Food. <span className="text-[#2E7D5B]">Spread Hope.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#718078] leading-relaxed">
            Annadhara connects restaurants, communities, NGOs and volunteers to ensure surplus food reaches people who need it.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to={isAuthenticated ? (isDonor ? '/create-donation' : '/dashboard') : '/register?role=donor'}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <span>Donate Food</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/find-food"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-[#205B43] bg-[#EAF4EE] hover:bg-[#d9ede0] border border-[#2E7D5B]/20 transition-all flex items-center justify-center space-x-2"
            >
              <span>Find Food</span>
            </Link>
            <Link
              to="/register?role=volunteer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-[#26332D] bg-white hover:bg-stone-50 border border-stone-200/80 shadow-xs transition-all flex items-center justify-center space-x-2"
            >
              <span>Become a Volunteer</span>
            </Link>
          </div>

          {/* Core Commitments */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 text-left">
            <div className="bg-white/90 backdrop-blur-xs p-4 rounded-xl border border-stone-200/70 shadow-xs">
              <div className="text-xl font-black text-[#205B43]">Verified</div>
              <p className="text-xs font-bold text-[#26332D] mt-1">Shelters & Trusts</p>
              <p className="text-[11px] text-[#718078] mt-0.5">Admin-approved non-profits</p>
            </div>
            <div className="bg-white/90 backdrop-blur-xs p-4 rounded-xl border border-stone-200/70 shadow-xs">
              <div className="text-xl font-black text-[#205B43]">Zero Waste</div>
              <p className="text-xs font-bold text-[#26332D] mt-1">Atomic Inventory</p>
              <p className="text-[11px] text-[#718078] mt-0.5">No oversubscription</p>
            </div>
            <div className="bg-white/90 backdrop-blur-xs p-4 rounded-xl border border-stone-200/70 shadow-xs">
              <div className="text-xl font-black text-[#205B43]">Secure</div>
              <p className="text-xs font-bold text-[#26332D] mt-1">Code & QR Handover</p>
              <p className="text-[11px] text-[#718078] mt-0.5">Closed-loop verification</p>
            </div>
            <div className="bg-white/90 backdrop-blur-xs p-4 rounded-xl border border-stone-200/70 shadow-xs">
              <div className="text-xl font-black text-[#205B43]">Pan-India</div>
              <p className="text-xs font-bold text-[#26332D] mt-1">Local Communities</p>
              <p className="text-[11px] text-[#718078] mt-0.5">Bengaluru & growing</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Simple Workflow */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#2E7D5B]">Simple & Transparent</p>
          <h2 className="text-3xl font-extrabold text-[#26332D]">How Annadhara Works</h2>
          <p className="text-sm text-[#718078]">
            A reliable 4-step workflow connecting food donors with Indian charitable kitchens and volunteers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col relative">
            <div className="w-12 h-12 rounded-xl bg-[#EAF4EE] text-[#2E7D5B] flex items-center justify-center font-black text-lg mb-4">
              1
            </div>
            <h3 className="text-base font-bold text-[#26332D] mb-1.5">1. Donate surplus food.</h3>
            <p className="text-xs text-[#718078] leading-relaxed">
              Donors publish excess meals, quantity in portions or kg, preparation time, and safe pickup deadline.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col relative">
            <div className="w-12 h-12 rounded-xl bg-[#EAF4EE] text-[#2E7D5B] flex items-center justify-center font-black text-lg mb-4">
              2
            </div>
            <h3 className="text-base font-bold text-[#26332D] mb-1.5">2. Connect with nearby organizations.</h3>
            <p className="text-xs text-[#718078] leading-relaxed">
              Nearby registered NGOs, charitable trusts, and community kitchens discover listings and request reservations.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col relative">
            <div className="w-12 h-12 rounded-xl bg-[#EAF4EE] text-[#2E7D5B] flex items-center justify-center font-black text-lg mb-4">
              3
            </div>
            <h3 className="text-base font-bold text-[#26332D] mb-1.5">3. Coordinate pickup.</h3>
            <p className="text-xs text-[#718078] leading-relaxed">
              Field volunteers claim transport tasks, review food handling instructions, and coordinate timely transit.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col relative">
            <div className="w-12 h-12 rounded-xl bg-[#EAF4EE] text-[#2E7D5B] flex items-center justify-center font-black text-lg mb-4">
              4
            </div>
            <h3 className="text-base font-bold text-[#26332D] mb-1.5">4. Complete the handover.</h3>
            <p className="text-xs text-[#718078] leading-relaxed">
              Parties verify the delivery using a unique 6-character code or QR code, updating inventory in real time.
            </p>
          </div>
        </div>
      </section>

      {/* Available food preview from live database */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#2E7D5B]">Live Community Inventory</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#26332D]">Recent Available Food</h2>
          </div>
          <Link
            to="/find-food"
            className="text-sm font-bold text-[#2E7D5B] hover:text-[#205B43] flex items-center space-x-1"
          >
            <span>Explore all surplus food</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-[#718078]">Loading available food listings...</div>
        ) : recentDonations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentDonations.map((donation) => (
              <DonationCard key={donation._id} donation={donation} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-sm text-[#718078]">
            No surplus food published right now. Sign in as a food donor to publish available surplus meals!
          </div>
        )}
      </section>

      {/* Food Safety & FSSAI Advisory Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#EAF4EE]/70 rounded-2xl border border-[#2E7D5B]/20 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center space-x-2 text-xs font-bold text-[#205B43] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#2E7D5B]" />
              <span>Indian Food Safety Standards & Guidance</span>
            </div>
            <h3 className="text-lg font-bold text-[#26332D]">FSSAI Surplus Food Guidelines</h3>
            <p className="text-xs text-[#718078] leading-relaxed">
              {FOOD_SAFETY_DISCLAIMER}
            </p>
          </div>
          <Link
            to="/find-food"
            className="shrink-0 px-5 py-2.5 rounded-xl text-xs font-bold text-[#205B43] bg-white border border-[#2E7D5B]/30 hover:bg-stone-50 shadow-xs"
          >
            Review Safety Standards
          </Link>
        </div>
      </section>

      {/* Role Segments */}
      <section id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF4EE] text-[#205B43] flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#26332D]">For Food Donors</h3>
              <p className="text-xs text-[#718078] leading-relaxed">
                Restaurants, caterers, college canteens, bakeries, and marriage halls. Turn surplus inventory into fresh meals for local communities with zero hassle.
              </p>
            </div>
            <Link
              to="/register?role=donor"
              className="mt-6 text-xs font-bold text-[#2E7D5B] hover:text-[#205B43] flex items-center space-x-1"
            >
              <span>Register as a Food Donor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF4EE] text-[#205B43] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#26332D]">For Recipient NGOs & Trusts</h3>
              <p className="text-xs text-[#718078] leading-relaxed">
                Registered non-profits, orphanages, old age homes, and community kitchens. Gain reliable, dignified access to wholesome meals with guaranteed reservations.
              </p>
            </div>
            <Link
              to="/register?role=recipient"
              className="mt-6 text-xs font-bold text-[#2E7D5B] hover:text-[#205B43] flex items-center space-x-1"
            >
              <span>Register Organization</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF4EE] text-[#205B43] flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#26332D]">For Transport Volunteers</h3>
              <p className="text-xs text-[#718078] leading-relaxed">
                Help transport food across town. Flexible pickup missions in your locality, clear food handling notes, and direct social impact.
              </p>
            </div>
            <Link
              to="/register?role=volunteer"
              className="mt-6 text-xs font-bold text-[#2E7D5B] hover:text-[#205B43] flex items-center space-x-1"
            >
              <span>Become a Volunteer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
