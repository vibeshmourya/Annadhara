import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ShieldCheck, AlertCircle, ArrowLeft, Image as ImageIcon, MapPin, Clock, Calendar } from 'lucide-react';
import { donationApi } from '../api/endpoints';

export const CreateDonation = () => {
  const navigate = useNavigate();

  const now = new Date();
  const defaultPrep = new Date(now.getTime() - 1 * 3600 * 1000).toISOString().slice(0, 16);
  const defaultPickupStart = now.toISOString().slice(0, 16);
  const defaultPickupEnd = new Date(now.getTime() + 6 * 3600 * 1000).toISOString().slice(0, 16);
  const defaultExpiry = new Date(now.getTime() + 12 * 3600 * 1000).toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    title: '',
    category: 'cooked_meals',
    description: '',
    totalQuantity: 20,
    unit: 'meals',
    prepDateTime: defaultPrep,
    expiryDateTime: defaultExpiry,
    storageHandling: 'hot_held',
    allergens: '',
    street: '425 Garden Way',
    city: 'Metropolis',
    state: 'NY',
    postalCode: '10012',
    pickupStartTime: defaultPickupStart,
    pickupEndTime: defaultPickupEnd,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    safetyGuidelinesAccepted: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.safetyGuidelinesAccepted) {
      setError('You must confirm the food safety declaration before publishing');
      return;
    }

    if (new Date(formData.pickupEndTime) <= new Date(formData.pickupStartTime)) {
      setError('Pickup deadline must be after pickup start time');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        totalQuantity: Number(formData.totalQuantity),
        unit: formData.unit,
        prepDateTime: new Date(formData.prepDateTime).toISOString(),
        expiryDateTime: new Date(formData.expiryDateTime).toISOString(),
        storageHandling: formData.storageHandling,
        allergens: formData.allergens
          ? formData.allergens.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        pickupLocation: {
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
          },
          location: {
            type: 'Point',
            coordinates: [-73.9912, 40.7258], // Standard city coordinates
          },
        },
        pickupStartTime: new Date(formData.pickupStartTime).toISOString(),
        pickupEndTime: new Date(formData.pickupEndTime).toISOString(),
        imageUrl: formData.imageUrl,
        safetyGuidelinesAccepted: true,
      };

      const res = await donationApi.create(payload);
      if (res.data.success) {
        navigate('/my-donations');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to publish donation'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#718078] hover:text-[#26332D]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel & Return</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-10 shadow-xs space-y-8">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#EAF4EE] text-[#205B43] text-xs font-bold mb-2">
            <PlusCircle className="w-3.5 h-3.5 text-[#2E7D5B]" />
            <span>Donor Action</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26332D] tracking-tight">
            Publish Surplus Food Donation
          </h1>
          <p className="text-xs sm:text-sm text-[#718078] mt-1">
            Fill in the details below. Once submitted, your surplus food will immediately appear to verified community charities.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-[#D9534F] flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Food Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#205B43] border-b border-stone-100 pb-2">
              1. Food Description & Quantity
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#26332D] mb-1">Food Name / Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 35 Portions Vegetable Lasagna & Salad"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26332D] mb-1">Food Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
                >
                  <option value="cooked_meals">🍲 Cooked Meals</option>
                  <option value="bakery_grains">🥖 Bakery & Grains</option>
                  <option value="produce_fresh">🥦 Fresh Produce</option>
                  <option value="packaged_groceries">📦 Packaged Groceries</option>
                  <option value="dairy">🥛 Dairy</option>
                  <option value="prepared_catering">🍱 Catering Trays</option>
                  <option value="beverages">🧃 Beverages</option>
                  <option value="other">🥗 Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#26332D] mb-1">Description & Packaging *</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Describe preparation, containers, and packaging (e.g. Packed in heat-sealed aluminum catering trays)..."
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-[#F8FAF8] text-xs text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#26332D] mb-1">Available Quantity *</label>
                <input
                  type="number"
                  name="totalQuantity"
                  min="1"
                  step="any"
                  value={formData.totalQuantity}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm font-bold text-[#26332D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26332D] mb-1">Unit of Measurement *</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D]"
                >
                  <option value="meals">Meals</option>
                  <option value="portions">Portions</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="boxes">Boxes</option>
                  <option value="liters">Liters</option>
                  <option value="packs">Packs</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Safety & Storage */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#205B43] border-b border-stone-100 pb-2">
              2. Food Safety & Storage
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#26332D] mb-1">Storage & Handling Condition *</label>
                <select
                  name="storageHandling"
                  value={formData.storageHandling}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D]"
                >
                  <option value="hot_held">🔥 Hot Held (Above 60°C)</option>
                  <option value="refrigerated">❄️ Refrigerated (Below 4°C)</option>
                  <option value="room_temperature">🍞 Room Temperature (Dry Goods)</option>
                  <option value="frozen">🧊 Frozen</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26332D] mb-1">Allergens (Comma separated)</label>
                <input
                  type="text"
                  name="allergens"
                  value={formData.allergens}
                  onChange={handleChange}
                  placeholder="e.g. Dairy, Gluten, Nuts (or None)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26332D] mb-1">Preparation Date & Time *</label>
                <input
                  type="datetime-local"
                  name="prepDateTime"
                  value={formData.prepDateTime}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-xs text-[#26332D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26332D] mb-1">Consumption / Expiry Deadline *</label>
                <input
                  type="datetime-local"
                  name="expiryDateTime"
                  value={formData.expiryDateTime}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-xs text-[#26332D]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Pickup Windows & Location */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#205B43] border-b border-stone-100 pb-2">
              3. Pickup Location & Timing
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#26332D] mb-1">Pickup Available From *</label>
                <input
                  type="datetime-local"
                  name="pickupStartTime"
                  value={formData.pickupStartTime}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-xs text-[#26332D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26332D] mb-1">Pickup Deadline *</label>
                <input
                  type="datetime-local"
                  name="pickupEndTime"
                  value={formData.pickupEndTime}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-xs text-[#26332D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#26332D] mb-1">Pickup Street Address *</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 425 Garden Way (Side kitchen entrance)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26332D] mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  placeholder="Metropolis"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#26332D] mb-1">Optional Food Photo URL</label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-xs text-[#26332D]"
              />
            </div>
          </div>

          {/* Safety Confirmation Checkbox */}
          <div className="p-4 rounded-2xl bg-[#EAF4EE] border border-[#2E7D5B]/20 flex items-start space-x-3">
            <input
              type="checkbox"
              id="safetyGuidelinesAccepted"
              name="safetyGuidelinesAccepted"
              checked={formData.safetyGuidelinesAccepted}
              onChange={handleChange}
              className="mt-1 w-4 h-4 rounded text-[#2E7D5B] focus:ring-[#2E7D5B]"
            />
            <label htmlFor="safetyGuidelinesAccepted" className="text-xs text-[#205B43] leading-relaxed cursor-pointer">
              <strong>Food Safety & Quality Declaration:</strong> I certify that this surplus food was prepared in a hygienic, food-safe environment, has been maintained at appropriate temperatures, is wholesome and safe for human consumption, and all known allergen information has been declared.
            </label>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={() => navigate('/my-donations')}
              className="px-6 py-3 rounded-xl text-xs font-bold text-[#718078] bg-stone-100 hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-md transition-all flex items-center justify-center space-x-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>Publish Donation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

