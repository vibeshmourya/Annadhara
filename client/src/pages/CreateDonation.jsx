import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Image as ImageIcon,
  UploadCloud,
  Link as LinkIcon,
  Sparkles,
  Trash2,
  RefreshCw,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { donationApi, uploadApi } from '../api/endpoints';
import {
  FOOD_CATEGORIES,
  FOOD_UNITS,
  DIETARY_TYPES,
  INDIAN_STATES,
  isValidPINCode,
  FOOD_SAFETY_DISCLAIMER,
  DEFAULT_FOOD_IMAGE,
  resolveImageUrl,
} from '../constants/india';

// Common non-vegetarian indicator keywords for mismatch warning
const NON_VEG_REGEX = /\b(egg|eggs|chicken|mutton|fish|meat|beef|pork|prawn|prawns|seafood|bacon|ham|crab|crabs|duck|keema|gosht|murgh)\b/i;

// Curated high quality food image presets
const FOOD_PRESETS = [
  {
    name: 'Rice & Meals',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    icon: '🍚',
  },
  {
    name: 'Roti & Sabzi',
    url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
    icon: '🫓',
  },
  {
    name: 'Biryani',
    url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    icon: '🍲',
  },
  {
    name: 'Idli & Dosa',
    url: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80',
    icon: '🥞',
  },
  {
    name: 'Bakery & Bread',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    icon: '🍞',
  },
  {
    name: 'Fruits & Veggies',
    url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&auto=format&fit=crop&q=80',
    icon: '🍎',
  },
];

const INDIAN_CITY_COORDINATES = {
  'bengaluru': [77.5946, 12.9716],
  'bangalore': [77.5946, 12.9716],
  'mumbai': [72.8777, 19.0760],
  'delhi': [77.1025, 28.7041],
  'new delhi': [77.2090, 28.6139],
  'hyderabad': [78.4867, 17.3850],
  'chennai': [80.2707, 13.0827],
  'kolkata': [88.3639, 22.5726],
  'pune': [73.8567, 18.5204],
  'ahmedabad': [72.5714, 23.0225],
  'jaipur': [75.7873, 26.9124],
  'lucknow': [80.9462, 26.8467],
  'chandigarh': [76.7794, 30.7333],
  'kochi': [76.2673, 9.9312],
  'bhopal': [77.4126, 23.2599],
  'patna': [85.1376, 25.5941],
  'surat': [72.8311, 21.1702],
  'nagpur': [79.0882, 21.1458],
  'indore': [75.8577, 22.7196],
  'coimbatore': [76.9558, 11.0168],
};

export const CreateDonation = () => {
  const navigate = useNavigate();

  const now = new Date();
  const defaultPickupStart = now.toISOString().slice(0, 16);
  const defaultPickupEnd = new Date(now.getTime() + 6 * 3600 * 1000).toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    title: '',
    category: 'rice_meals',
    dietaryType: 'Vegetarian',
    description: '',
    totalQuantity: 25,
    unit: 'meals',
    storageHandling: 'hot_held',
    allergens: '',
    street: '42/1, 12th Main Road',
    areaLocality: 'HAL 2nd Stage, Indiranagar',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    postalCode: '560038',
    country: 'India',
    fssaiNumber: '',
    pickupStartTime: defaultPickupStart,
    pickupEndTime: defaultPickupEnd,
    imageUrl: FOOD_PRESETS[0].url,
    safetyGuidelinesAccepted: false,
  });

  const [imageTab, setImageTab] = useState('upload'); // 'upload' | 'url' | 'presets'
  const [urlInput, setUrlInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // GPS Device Geolocation State
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');

  const handleDetectGPS = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('Geolocation not supported by your browser');
      return;
    }
    setDetectingLocation(true);
    setGpsStatus('Detecting device coordinates via GPS...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeviceLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setDetectingLocation(false);
        setGpsStatus(`GPS locked: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} ✓`);
      },
      () => {
        setDetectingLocation(false);
        setGpsStatus('Location permission denied or unavailable. Using city center.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Check for dietary mismatch
  const dietaryMismatch = useMemo(() => {
    if (formData.dietaryType === 'Vegetarian' || formData.dietaryType === 'Vegan') {
      const textToScan = `${formData.title} ${formData.description}`;
      const match = textToScan.match(NON_VEG_REGEX);
      if (match) {
        return match[0];
      }
    }
    return null;
  }, [formData.dietaryType, formData.title, formData.description]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle local file selection and upload
  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate size (5 MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5 MB. Please select a smaller photo.');
      return;
    }

    // Validate mime
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadError('Only JPG, PNG, and WebP images are supported.');
      return;
    }

    try {
      setUploadingImage(true);
      setUploadError('');
      const uploadData = new FormData();
      uploadData.append('image', file);

      const res = await uploadApi.uploadImage(uploadData);
      if (res.data?.success && res.data?.data?.url) {
        setFormData((prev) => ({ ...prev, imageUrl: res.data.data.url }));
      } else {
        setUploadError('Upload failed. Please try again.');
      }
    } catch (err) {
      setUploadError(
        err.response?.data?.message || 'Error uploading image to server. You may also provide a direct URL.'
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setFormData((prev) => ({ ...prev, imageUrl: urlInput.trim() }));
    setUrlInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.safetyGuidelinesAccepted) {
      setError('You must confirm the food information and handling declaration before publishing');
      return;
    }

    if (new Date(formData.pickupEndTime) <= new Date(formData.pickupStartTime)) {
      setError('Pickup deadline must be after pickup start time');
      return;
    }

    if (formData.postalCode && !isValidPINCode(formData.postalCode)) {
      setError('Please provide a valid 6-digit Indian PIN code (e.g. 560038)');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        dietaryType: formData.dietaryType,
        description: formData.description.trim(),
        totalQuantity: Number(formData.totalQuantity),
        unit: formData.unit,
        storageHandling: formData.storageHandling,
        allergens: formData.allergens
          ? formData.allergens.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        fssaiNumber: formData.fssaiNumber ? formData.fssaiNumber.trim() : '',
        fssaiDeclaration: Boolean(formData.safetyGuidelinesAccepted),
        pickupLocation: {
          address: {
            street: formData.street.trim(),
            areaLocality: formData.areaLocality.trim(),
            city: formData.city.trim(),
            district: formData.district.trim(),
            state: formData.state.trim(),
            postalCode: formData.postalCode.trim(),
            country: 'India',
          },
          location: {
            type: 'Point',
            // Real-life coordinates: Uses GPS coordinates if detected, else mapped Indian city coordinates, else default Bengaluru
            coordinates: deviceLocation
              ? [Number(deviceLocation.lng), Number(deviceLocation.lat)]
              : (INDIAN_CITY_COORDINATES[formData.city.trim().toLowerCase()] || [77.5946, 12.9716]),
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
            <span>🇮🇳 Indian Food Rescue Listing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26332D] tracking-tight">
            Publish Surplus Food Donation
          </h1>
          <p className="text-xs sm:text-sm text-[#718078] mt-1">
            Fill in the details below. Once submitted, your surplus food will immediately appear to verified community charities, trusts, and shelter kitchens.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-[#D9534F] flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Dietary Mismatch Warning Banner */}
        {dietaryMismatch && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2.5 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Dietary Classification Warning: </span>
              You have selected <strong>{formData.dietaryType}</strong>, but your title or description contains the word "<strong>{dietaryMismatch}</strong>", which may indicate non-vegetarian ingredients. Please ensure the classification matches the prepared dish.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Food Details & Indian Categories */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#205B43] border-b border-stone-100 pb-2">
              1. Food Description, Category & Dietary Type
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
                  placeholder="e.g. 30 Plates Veg Biryani & Dal Makhani"
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
                  {FOOD_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dietary Type Selector */}
            <div>
              <label className="block text-xs font-bold text-[#26332D] mb-1.5">Dietary Classification *</label>
              <div className="grid grid-cols-3 gap-3">
                {DIETARY_TYPES.map((dt) => (
                  <button
                    key={dt.id}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, dietaryType: dt.id }))}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 border transition-all ${
                      formData.dietaryType === dt.id
                        ? `${dt.color} ring-2 ring-[#2E7D5B]/20 shadow-xs font-extrabold`
                        : 'bg-[#F8FAF8] text-[#718078] border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span>{dt.symbol}</span>
                    <span>{dt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#26332D] mb-1">Description & Ingredients</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Describe key ingredients, preparation, containers, and packaging (e.g. Packed in food-grade aluminum trays, prepared fresh for afternoon buffet)..."
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
                  {FOOD_UNITS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Storage, Allergens & FSSAI */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#205B43] border-b border-stone-100 pb-2">
              2. Food Storage, Handling & Allergens
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#26332D] mb-1">Storage Condition *</label>
                <select
                  name="storageHandling"
                  value={formData.storageHandling}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D]"
                >
                  <option value="hot_held">🔥 Hot Held (Above 65°C)</option>
                  <option value="refrigerated">❄️ Refrigerated (Below 4°C)</option>
                  <option value="room_temperature">🍞 Room Temperature (Dry Goods)</option>
                  <option value="frozen">🧊 Frozen</option>
                  <option value="other">🍽️ Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26332D] mb-1">Allergens</label>
                <input
                  type="text"
                  name="allergens"
                  value={formData.allergens}
                  onChange={handleChange}
                  placeholder="e.g. Dairy, Gluten, Peanuts (or None)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26332D] mb-1">
                  FSSAI License No. <span className="text-[10px] text-[#718078] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="fssaiNumber"
                  value={formData.fssaiNumber}
                  onChange={handleChange}
                  placeholder="14-digit FSSAI No."
                  maxLength={14}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Food Image Selection & Upload */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#205B43] border-b border-stone-100 pb-2">
              3. Food Image
            </h3>

            {/* Image Preview & Current Selection */}
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="relative w-full sm:w-48 h-36 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shrink-0 shadow-xs">
                {formData.imageUrl ? (
                  <img
                    src={resolveImageUrl(formData.imageUrl)}
                    alt="Food preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = DEFAULT_FOOD_IMAGE;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-[10px]">No Image Selected</span>
                  </div>
                )}
                {formData.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, imageUrl: '' }))}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                    title="Remove image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex-1 w-full space-y-3">
                {/* Method Tabs */}
                <div className="flex space-x-2 border-b border-stone-200 pb-2">
                  <button
                    type="button"
                    onClick={() => setImageTab('upload')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors ${
                      imageTab === 'upload'
                        ? 'bg-[#2E7D5B] text-white'
                        : 'bg-stone-100 text-[#718078] hover:bg-stone-200'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Device Upload</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageTab('url')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors ${
                      imageTab === 'url'
                        ? 'bg-[#2E7D5B] text-white'
                        : 'bg-stone-100 text-[#718078] hover:bg-stone-200'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Image URL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageTab('presets')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors ${
                      imageTab === 'presets'
                        ? 'bg-[#2E7D5B] text-white'
                        : 'bg-stone-100 text-[#718078] hover:bg-stone-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Quick Presets</span>
                  </button>
                </div>

                {uploadError && (
                  <p className="text-[11px] text-[#D9534F] font-semibold">{uploadError}</p>
                )}

                {/* Tab: Upload */}
                {imageTab === 'upload' && (
                  <div className="border-2 border-dashed border-stone-200 rounded-2xl p-4 text-center hover:border-[#2E7D5B]/50 transition-colors bg-[#F8FAF8]">
                    <input
                      type="file"
                      id="food-photo-input"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="food-photo-input"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                    >
                      {uploadingImage ? (
                        <>
                          <RefreshCw className="w-6 h-6 text-[#2E7D5B] animate-spin" />
                          <span className="text-xs font-bold text-[#205B43]">Uploading image...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-6 h-6 text-[#2E7D5B]" />
                          <span className="text-xs font-bold text-[#26332D]">
                            Click to browse photo from your device
                          </span>
                          <span className="text-[11px] text-[#718078]">
                            Supports JPG, PNG, and WebP (Max 5 MB)
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                )}

                {/* Tab: URL */}
                {imageTab === 'url' && (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Paste image link (https://...)"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-stone-200 bg-[#F8FAF8] text-xs text-[#26332D]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43]"
                    >
                      Apply
                    </button>
                  </div>
                )}

                {/* Tab: Presets */}
                {imageTab === 'presets' && (
                  <div className="grid grid-cols-3 gap-2">
                    {FOOD_PRESETS.map((pst) => (
                      <button
                        key={pst.name}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, imageUrl: pst.url }))}
                        className={`p-2 rounded-xl border text-xs font-bold text-left flex items-center space-x-1.5 transition-all ${
                          formData.imageUrl === pst.url
                            ? 'border-[#2E7D5B] bg-[#EAF4EE] text-[#205B43]'
                            : 'border-stone-200 bg-[#F8FAF8] text-[#718078] hover:bg-stone-100'
                        }`}
                      >
                        <span className="text-sm">{pst.icon}</span>
                        <span className="truncate">{pst.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Pickup Window & Indian Address */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-2 gap-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#205B43]">
                4. Pickup Availability Window & Location (India)
              </h3>
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={detectingLocation}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#EAF4EE] text-[#205B43] hover:bg-[#d5edd9] transition-colors self-start sm:self-auto"
              >
                <span>📍</span>
                <span>{detectingLocation ? 'Detecting GPS...' : 'Auto-Detect Device GPS'}</span>
              </button>
            </div>

            {gpsStatus && (
              <div className="px-3.5 py-2 rounded-xl bg-[#EAF4EE]/70 border border-[#2E7D5B]/20 text-xs text-[#205B43] font-medium">
                {gpsStatus}
              </div>
            )}

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
                <label className="block text-xs font-bold text-[#26332D] mb-1">Pickup Deadline / End Time *</label>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#26332D] mb-1">House / Building / Street *</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 42/1, 12th Main Road (Side entrance)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26332D] mb-1">Area / Locality</label>
                <input
                  type="text"
                  name="areaLocality"
                  value={formData.areaLocality}
                  onChange={handleChange}
                  placeholder="e.g. HAL 2nd Stage, Indiranagar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#26332D] mb-1">City / Town *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  placeholder="Bengaluru"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26332D] mb-1">State / UT *</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-xs text-[#26332D]"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26332D] mb-1">PIN Code (6 digits) *</label>
                <input
                  type="text"
                  name="postalCode"
                  maxLength={6}
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                  placeholder="560038"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D]"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Accurate Declaration Checkbox & FSSAI Advisory */}
          <div className="p-4 rounded-2xl bg-[#EAF4EE] border border-[#2E7D5B]/20 space-y-2">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="safetyGuidelinesAccepted"
                name="safetyGuidelinesAccepted"
                checked={formData.safetyGuidelinesAccepted}
                onChange={handleChange}
                className="mt-1 w-4 h-4 rounded text-[#2E7D5B] focus:ring-[#2E7D5B]"
              />
              <label htmlFor="safetyGuidelinesAccepted" className="text-xs text-[#205B43] leading-relaxed cursor-pointer">
                <strong>Food Quality & Safety Declaration:</strong> I confirm that the food information provided is accurate and that the food has been handled responsibly in accordance with food safety standards.
              </label>
            </div>
            <p className="text-[11px] text-[#718078] pl-7 leading-relaxed">
              {FOOD_SAFETY_DISCLAIMER}
            </p>
          </div>

          {/* Submit Buttons */}
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
