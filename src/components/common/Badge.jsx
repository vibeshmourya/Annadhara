import React from 'react';

export const StatusBadge = ({ status }) => {
  const configs = {
    available: { label: 'Available', bg: 'bg-[#EAF4EE]', text: 'text-[#205B43]', border: 'border-[#2E7D5B]/20' },
    partially_reserved: { label: 'Partially Reserved', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    fully_reserved: { label: 'Fully Reserved', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
    completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    pending: { label: 'Pending Review', bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
    approved: { label: 'Approved', bg: 'bg-[#EAF4EE]', text: 'text-[#205B43]', border: 'border-[#2E7D5B]/30' },
    rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    cancelled: { label: 'Cancelled', bg: 'bg-stone-100', text: 'text-stone-600', border: 'border-stone-200' },
    assigned: { label: 'Pickup Assigned', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    in_progress: { label: 'In Progress', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    collected: { label: 'Collected', bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
    verified: { label: 'Verified Org', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
    expired: { label: 'Expired', bg: 'bg-stone-100', text: 'text-stone-600', border: 'border-stone-200' },
  };

  const current = configs[status] || {
    label: status ? status.replace('_', ' ') : 'Unknown',
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    border: 'border-stone-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.bg} ${current.text} ${current.border}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {current.label}
    </span>
  );
};

export const CategoryBadge = ({ category }) => {
  const labels = {
    // Indian Food Categories
    rice_meals: '🍚 Rice and Meals',
    roti_chapati: '🫓 Roti / Chapati',
    idli_dosa: '🥞 Idli / Dosa',
    biryani: '🍲 Biryani',
    snacks: '🥟 Snacks',
    bakery_items: '🍞 Bakery Items',
    fruits: '🍎 Fruits',
    vegetables: '🥦 Vegetables',
    packaged_food: '📦 Packaged Food',
    groceries: '🌾 Groceries',
    dairy_products: '🥛 Dairy Products',
    // Platform standard categories
    cooked_meals: '🍱 Cooked Meals',
    bakery_grains: '🥖 Bakery & Grains',
    produce_fresh: '🥦 Fresh Produce',
    packaged_groceries: '📦 Packaged Food',
    dairy: '🥛 Dairy',
    beverages: '🧃 Beverages',
    prepared_catering: '🍱 Catering Trays',
    other: '🍽️ Other Food',
  };

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F1F5F2] text-[#26332D] border border-stone-200/60">
      {labels[category] || category}
    </span>
  );
};

export const DietaryBadge = ({ dietaryType }) => {
  const isVeg = !dietaryType || dietaryType === 'Vegetarian' || dietaryType === 'Veg';
  const isVegan = dietaryType === 'Vegan';

  if (isVegan) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
        🌱 Vegan
      </span>
    );
  }

  if (isVeg) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-green-50 text-green-800 border border-green-200">
        <span className="w-2 h-2 rounded-full bg-green-600 mr-1.5 inline-block" />
        Veg
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-50 text-red-800 border border-red-200">
      <span className="w-2 h-2 rounded-full bg-red-600 mr-1.5 inline-block" />
      Non-Veg
    </span>
  );
};

export const FSSAIBadge = ({ number }) => {
  if (!number) return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
      FSSAI: {number}
    </span>
  );
};
