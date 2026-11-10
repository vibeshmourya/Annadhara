import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartHandshake,
  ShieldCheck,
  Truck,
  Building,
  Sparkles,
  ArrowRight,
  CheckCircle,
  PackageCheck,
  Users,
  Leaf,
  Clock,
} from 'lucide-react';
import { donationApi } from '../api/endpoints';
import { DonationCard } from '../components/donations/DonationCard';

export const Home = () => {
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
      <section className="relative overflow-hidden bg-gradient-to-b from-[#EAF4EE]/70 via-[#F8FAF8] to-[#F8FAF8] pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 border-b border-stone-200/40">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-[#2E7D5B]/20 text-[#205B43] text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#2E7D5B] animate-pulse" />
            <span>Connecting Surplus Food with Communities in Need</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-[#26332D] tracking-tight leading-[1.15]">
            Surplus Food. <span className="text-[#2E7D5B]">Shared Hope.</span> <br />
            Zero Waste.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#718078] leading-relaxed">
            Annadhara empowers restaurants, canteens, and food producers to instantly donate safe, surplus meals to verified
            NGOs, community kitchens, and shelters — supported by volunteer transport.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/find-food"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <span>Find Available Food</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-[#26332D] bg-white hover:bg-stone-50 border border-stone-200/80 shadow-sm transition-all"
            >
              Join as a Donor or NGO
            </Link>
          </div>

          {/* Quick Pillars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 text-left">
            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-stone-200/60 shadow-xs">
              <div className="text-2xl font-black text-[#205B43]">100%</div>
              <p className="text-xs font-bold text-[#26332D] mt-1">Verified Organizations</p>
              <p className="text-[11px] text-[#718078] mt-0.5">Vetted non-profits and shelters</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-stone-200/60 shadow-xs">
              <div className="text-2xl font-black text-[#205B43]">Atomic</div>
              <p className="text-xs font-bold text-[#26332D] mt-1">Zero Oversubscription</p>
              <p className="text-[11px] text-[#718078] mt-0.5">Precise quantity reservation</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-stone-200/60 shadow-xs">
              <div className="text-2xl font-black text-[#205B43]">Protected</div>
              <p className="text-xs font-bold text-[#26332D] mt-1">Code Handover</p>
              <p className="text-[11px] text-[#718078] mt-0.5">Secure 6-character verification</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-stone-200/60 shadow-xs">
              <div className="text-2xl font-black text-[#205B43]">1 Platform</div>
              <p className="text-xs font-bold text-[#26332D] mt-1">Web & Mobile Ready</p>
              <p className="text-[11px] text-[#718078] mt-0.5">Shared REST API & database</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#2E7D5B]">Simple & Transparent</p>
          <h2 className="text-3xl font-extrabold text-[#26332D]">How Annadhara Works</h2>
          <p className="text-sm text-[#718078]">
            Designed for clear collaboration without technical confusion or unnecessary steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-[#EAF4EE] text-[#2E7D5B] flex items-center justify-center font-black text-lg mb-4">
              1
            </div>
            <h3 className="text-base font-bold text-[#26332D] mb-1.5">Publish Surplus Food</h3>
            <p className="text-xs text-[#718078] leading-relaxed">
              Donors list surplus meals, category, available quantity, preparation time, and pickup deadline.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-[#EAF4EE] text-[#2E7D5B] flex items-center justify-center font-black text-lg mb-4">
              2
            </div>
            <h3 className="text-base font-bold text-[#26332D] mb-1.5">Discover & Reserve</h3>
            <p className="text-xs text-[#718078] leading-relaxed">
              Verified NGOs search nearby donations and request needed portions with atomic inventory protection.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-[#EAF4EE] text-[#2E7D5B] flex items-center justify-center font-black text-lg mb-4">
              3
            </div>
            <h3 className="text-base font-bold text-[#26332D] mb-1.5">Volunteer Pickup</h3>
            <p className="text-xs text-[#718078] leading-relaxed">
              Volunteers claim pickup tasks, review temperature instructions, and deliver food safely to recipients.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-[#EAF4EE] text-[#2E7D5B] flex items-center justify-center font-black text-lg mb-4">
              4
            </div>
            <h3 className="text-base font-bold text-[#26332D] mb-1.5">Verified Handover</h3>
            <p className="text-xs text-[#718078] leading-relaxed">
              Both parties verify handover with a secure 6-character code, recording real-time zero-waste impact.
            </p>
          </div>
        </div>
      </section>

      {/* Available food preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#2E7D5B]">Active Surplus Listings</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#26332D]">Recent Available Food</h2>
          </div>
          <Link
            to="/find-food"
            className="text-sm font-bold text-[#2E7D5B] hover:text-[#205B43] flex items-center space-x-1"
          >
            <span>Browse all listings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-[#718078]">Loading current available food...</div>
        ) : recentDonations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentDonations.map((donation) => (
              <DonationCard key={donation._id} donation={donation} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-sm text-[#718078]">
            No surplus food published right now. Sign in as a donor to publish food!
          </div>
        )}
      </section>

      {/* Role callouts */}
      <section id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF4EE] text-[#205B43] flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#26332D]">For Donors</h3>
              <p className="text-xs text-[#718078] leading-relaxed">
                Restaurants, bakeries, canteens, and catering services. Turn surplus inventory into tax-deductible community relief.
              </p>
            </div>
            <Link
              to="/register?role=donor"
              className="mt-6 text-xs font-bold text-[#2E7D5B] hover:text-[#205B43] flex items-center space-x-1"
            >
              <span>Register as a Donor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF4EE] text-[#205B43] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#26332D]">For Recipient NGOs</h3>
              <p className="text-xs text-[#718078] leading-relaxed">
                Charities, food banks, and shelters. Gain reliable access to nutritious, prepared meals and fresh produce.
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
              <h3 className="text-lg font-bold text-[#26332D]">For Volunteers</h3>
              <p className="text-xs text-[#718078] leading-relaxed">
                Transport surplus food from kitchens to shelters in your community. Flexible pickup missions on your schedule.
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

