import React from 'react';
import { PackageOpen, Sparkles } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'There are no active records in this view right now.',
  action = null,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-dashed border-stone-300 my-4 shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-[#EAF4EE] text-[#2E7D5B] flex items-center justify-center mb-4 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-[#26332D] mb-1">{title}</h3>
      <p className="text-sm text-[#718078] max-w-sm mb-6 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-3">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-[#EAF4EE] border-t-[#2E7D5B] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-[#205B43]/20 animate-pulse" />
        </div>
      </div>
      {text && <p className="text-sm font-medium text-[#718078]">{text}</p>}
    </div>
  );
};

export const StatCard = ({ title, value, unit, icon: Icon, description, trendColor = 'text-[#2E7D5B]' }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-[#718078] mb-1">{title}</p>
          <div className="flex items-baseline space-x-1.5">
            <h4 className="text-3xl font-extrabold text-[#26332D] tracking-tight">{value}</h4>
            {unit && <span className="text-sm font-medium text-[#718078]">{unit}</span>}
          </div>
          {description && <p className={`text-xs mt-2 font-medium ${trendColor}`}>{description}</p>}
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#EAF4EE] text-[#2E7D5B] flex items-center justify-center shadow-sm">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

