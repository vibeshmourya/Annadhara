import React from 'react';
import { Search, SlidersHorizontal, MapPin } from 'lucide-react';
import { INDIAN_CITIES } from '../../constants/india';

export const DonationFilter = ({
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  categories,
  selectedCity = 'all',
  setSelectedCity,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-sm space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718078]">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by food name, description, or city..."
          className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B] transition-all"
        />
      </div>

      {/* City Filter Chips */}
      {setSelectedCity && (
        <div>
          <div className="flex items-center space-x-1.5 text-xs font-bold text-[#718078] uppercase tracking-wider mb-2.5">
            <MapPin className="w-3.5 h-3.5 text-[#2E7D5B]" />
            <span>Filter by Indian City:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', ...INDIAN_CITIES].map((city) => {
              const isSelected = (selectedCity || 'all') === city;
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#2E7D5B] text-white shadow-sm'
                      : 'bg-[#F1F5F2] text-[#26332D] hover:bg-stone-200/70 border border-stone-200/40'
                  }`}
                >
                  {city === 'all' ? '📍 All Cities' : city}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Filter Chips */}
      <div>
        <div className="flex items-center space-x-1.5 text-xs font-bold text-[#718078] uppercase tracking-wider mb-2.5">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filter by Category:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#2E7D5B] text-white shadow-sm'
                    : 'bg-[#F1F5F2] text-[#26332D] hover:bg-stone-200/70 border border-stone-200/40'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
