import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Building, ArrowRight } from 'lucide-react';
import { StatusBadge, CategoryBadge, DietaryBadge, FSSAIBadge } from '../common/Badge';
import { formatIndianDate, resolveImageUrl, DEFAULT_FOOD_IMAGE } from '../../constants/india';

export const DonationCard = ({ donation, onReserveClick }) => {
  const {
    _id,
    title,
    category,
    dietaryType,
    fssaiNumber,
    description,
    availableQuantity,
    unit,
    donor,
    organization,
    pickupLocation,
    pickupEndTime,
    status,
    imageUrl,
    distanceKm,
  } = donation;

  // Compute countdown/time remaining
  const now = new Date();
  const deadline = new Date(pickupEndTime);
  const diffHours = Math.round((deadline - now) / (1000 * 60 * 60));
  const isUrgent = diffHours <= 4 && diffHours > 0;
  const isExpired = deadline <= now;

  const locationDisplay =
    pickupLocation?.address?.areaLocality && pickupLocation?.address?.city
      ? `${pickupLocation.address.areaLocality}, ${pickupLocation.address.city}`
      : pickupLocation?.address?.city || 'Local Area, India';

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-stone-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col group">
      {/* Food Image & Top Badges */}
      <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
        <img
          src={resolveImageUrl(imageUrl)}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = DEFAULT_FOOD_IMAGE;
          }}
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <StatusBadge status={isExpired ? 'expired' : status} />
          {dietaryType && <DietaryBadge dietaryType={dietaryType} />}
        </div>

        {isUrgent && !isExpired && (
          <div className="absolute top-3 right-3 bg-[#D9534F] text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center space-x-1 animate-pulse">
            <Clock className="w-3 h-3" />
            <span>Pickup in {diffHours}h</span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-2">
          <CategoryBadge category={category} />
          {fssaiNumber && <FSSAIBadge number={fssaiNumber} />}
        </div>

        <h3 className="text-base font-bold text-[#26332D] group-hover:text-[#2E7D5B] transition-colors line-clamp-1 mb-1">
          {title}
        </h3>

        <p className="text-xs text-[#718078] line-clamp-2 mb-4 leading-relaxed">{description}</p>

        {/* Quantities & Donor Info */}
        <div className="mt-auto space-y-2.5 pt-3 border-t border-stone-100 text-xs">
          {/* Quantity Badge */}
          <div className="flex items-center justify-between">
            <span className="text-[#718078] font-medium">Available Quantity:</span>
            <span className="text-sm font-bold text-[#205B43] bg-[#EAF4EE] px-2.5 py-0.5 rounded-lg">
              {availableQuantity} {unit}
            </span>
          </div>

          {/* Donor / Organization */}
          <div className="flex items-center text-[#718078] space-x-1.5 line-clamp-1">
            <Building className="w-3.5 h-3.5 text-[#2E7D5B] shrink-0" />
            <span className="font-semibold text-[#26332D]">{organization?.name || donor?.name || 'Verified Indian Donor'}</span>
          </div>

          {/* Location & Distance in Kilometers */}
          <div className="flex items-center justify-between text-[#718078]">
            <div className="flex items-center space-x-1.5 line-clamp-1">
              <MapPin className="w-3.5 h-3.5 text-[#2E7D5B] shrink-0" />
              <span>{locationDisplay}</span>
            </div>
            {distanceKm !== null && distanceKm !== undefined && (
              <span className="text-[11px] font-semibold text-[#2E7D5B] bg-emerald-50 px-2 py-0.5 rounded">
                {distanceKm} km away
              </span>
            )}
          </div>

          {/* Pickup Deadline formatted to Indian DD/MM/YYYY, hh:mm A */}
          <div className="flex items-center space-x-1.5 text-[#718078]">
            <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>Pickup until {formatIndianDate(pickupEndTime)}</span>
          </div>
        </div>

        {/* Card Actions */}
        <div className="pt-4 mt-4 border-t border-stone-100 flex items-center space-x-2">
          <Link
            to={`/donations/${_id}`}
            className="flex-1 text-center py-2 px-3 rounded-xl text-xs font-semibold text-[#26332D] bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            View Details
          </Link>
          {onReserveClick && status === 'available' && availableQuantity > 0 && !isExpired && (
            <button
              type="button"
              onClick={() => onReserveClick(donation)}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-xs transition-colors flex items-center justify-center space-x-1"
            >
              <span>Reserve</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
