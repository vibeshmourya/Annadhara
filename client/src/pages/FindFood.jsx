import React, { useState, useEffect } from 'react';
import { donationApi } from '../api/endpoints';
import { DonationCard } from '../components/donations/DonationCard';
import { DonationFilter } from '../components/donations/DonationFilter';
import { ReservationModal } from '../components/donations/ReservationModal';
import { LoadingSpinner, EmptyState } from '../components/common/StatCard';
import { useAuth } from '../context/AuthContext';
import { Compass, AlertCircle } from 'lucide-react';

export const FindFood = () => {
  const { isAuthenticated, isRecipient } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userLocation, setUserLocation] = useState(null);

  // Reservation Modal state
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);

  const categories = [
    { label: 'All Food', value: 'all' },
    { label: '🍲 Cooked Meals', value: 'cooked_meals' },
    { label: '🥖 Bakery & Grains', value: 'bakery_grains' },
    { label: '🥦 Fresh Produce', value: 'produce_fresh' },
    { label: '📦 Packaged Groceries', value: 'packaged_groceries' },
    { label: '🥛 Dairy', value: 'dairy' },
    { label: '🍱 Catering Trays', value: 'prepared_catering' },
  ];

  // Request browser geolocation if user agrees
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Ignore location denial; platform works with default ranking
        }
      );
    }
  }, []);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (search.trim()) {
        params.search = search.trim();
      }
      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
      }

      const res = await donationApi.getAll(params);
      if (res.data.success) {
        setDonations(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load surplus food listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchDonations();
    }, 250);
    return () => clearTimeout(debounce);
  }, [selectedCategory, search, userLocation]);

  const handleOpenReserve = (donation) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    setSelectedDonation(donation);
    setIsReserveModalOpen(true);
  };

  const handleReservationSuccess = () => {
    fetchDonations(); // Refresh available inventory counts atomically
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#EAF4EE] text-[#205B43] text-xs font-bold mb-2">
          <Compass className="w-3.5 h-3.5 text-[#2E7D5B]" />
          <span>Surplus Food Discovery</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26332D] tracking-tight">
          Find Available Surplus Food
        </h1>
        <p className="text-xs sm:text-sm text-[#718078] mt-1 max-w-2xl">
          Browse wholesome, fresh surplus food ready for immediate rescue and distribution to communities in need.
        </p>
      </div>

      {/* Filter Component */}
      <DonationFilter
        search={search}
        setSearch={setSearch}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
      />

      {/* Error alert if any */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-[#D9534F] flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Listings Grid */}
      {loading ? (
        <LoadingSpinner text="Searching for available surplus food..." />
      ) : donations.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4 text-xs text-[#718078]">
            <span>
              Showing <strong className="text-[#26332D] font-bold">{donations.length}</strong> active food donation listings
            </span>
            {userLocation && <span className="text-[#2E7D5B] font-semibold">📍 Sorted by nearest location</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {donations.map((donation) => (
              <DonationCard
                key={donation._id}
                donation={donation}
                onReserveClick={isRecipient ? handleOpenReserve : null}
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title="No food listings match your filter"
          description="Try broadening your category filter or search keywords, or check back soon as restaurants regularly post new surplus batches."
          action={
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-[#2E7D5B] text-white text-xs font-bold rounded-xl"
            >
              Reset Filters
            </button>
          }
        />
      )}

      {/* Reserve Food Modal */}
      <ReservationModal
        isOpen={isReserveModalOpen}
        onClose={() => setIsReserveModalOpen(false)}
        donation={selectedDonation}
        onReservationSuccess={handleReservationSuccess}
      />
    </div>
  );
};

