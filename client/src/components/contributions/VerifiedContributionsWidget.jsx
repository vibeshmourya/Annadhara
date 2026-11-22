import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Award,
  TrendingUp,
  Building,
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  Filter,
  X,
  ExternalLink,
} from 'lucide-react';
import { contributionApi } from '../../api/endpoints';
import { Modal } from '../common/Modal';

export const VerifiedContributionsWidget = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // History modal state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState({
    status: '',
    category: '',
  });

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await contributionApi.getMySummary();
      if (res.data.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.warn('Could not load verified contributions summary:', err);
      setError('Could not load verified contributions');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const params = {};
      if (historyFilter.status) params.status = historyFilter.status;
      if (historyFilter.category) params.category = historyFilter.category;
      const res = await contributionApi.getMyHistory(params);
      if (res.data.success) {
        setHistoryRecords(res.data.data.records || []);
      }
    } catch (err) {
      console.error('Failed to load contribution history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (isHistoryOpen) {
      fetchHistory();
    }
  }, [isHistoryOpen, historyFilter]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs animate-pulse space-y-4">
        <div className="h-6 w-1/3 bg-stone-100 rounded-lg" />
        <div className="h-20 bg-stone-50 rounded-xl" />
      </div>
    );
  }

  if (error || !summary) return null;

  const { recognition, totalVerifiedHandovers, totalVerifiedQuantity, organizationsSupportedCount, recentTimeline } = summary;
  const currentTier = recognition?.currentTier;
  const nextTier = recognition?.nextTier;
  const progressPercentage = recognition?.progressPercentage || 0;

  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAF4EE] text-[#2E7D5B] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#26332D]">My Verified Contributions</h3>
            <p className="text-xs text-[#718078]">
              Verified surplus food handovers successfully delivered to recipient organizations.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsHistoryOpen(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#205B43] bg-[#EAF4EE] hover:bg-[#d8ebe0] transition-colors"
        >
          <History className="w-3.5 h-3.5" />
          <span>Full History</span>
        </button>
      </div>

      {/* Recognition Tier & Milestone Progress */}
      <div className="p-4 rounded-xl bg-[#F8FAF8] border border-stone-200/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <Award className="w-5 h-5 text-[#2E7D5B]" />
            <div>
              <span className="text-xs text-[#718078]">Current Recognition Level: </span>
              <strong className="text-sm font-bold text-[#205B43]">{currentTier?.name}</strong>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-[#718078]">
            {totalVerifiedHandovers} verified {totalVerifiedHandovers === 1 ? 'handover' : 'handovers'} completed
          </span>
        </div>

        {/* Progress Bar towards Next Milestone */}
        {nextTier ? (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[#718078]">
              <span>Next Milestone: <strong className="text-[#26332D]">{nextTier.name}</strong></span>
              <span>{recognition.contributionsNeeded} more verified {recognition.contributionsNeeded === 1 ? 'handover' : 'handovers'} needed</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-stone-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#2E7D5B] transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="text-xs font-semibold text-[#205B43] bg-[#EAF4EE] p-2.5 rounded-lg flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Highest Recognition Tier Achieved! Thank you for being a pillar of food rescue in your community.</span>
          </div>
        )}

        <p className="text-[11px] text-[#718078] italic pt-1 border-t border-stone-200/50">
          "{currentTier?.description}"
        </p>
      </div>

      {/* Verified Impact Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/60">
          <div className="text-lg font-black text-[#205B43]">{totalVerifiedHandovers}</div>
          <div className="text-[11px] text-[#718078] font-medium mt-0.5">Verified Handovers</div>
        </div>
        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/60">
          <div className="text-lg font-black text-[#205B43]">{totalVerifiedQuantity}</div>
          <div className="text-[11px] text-[#718078] font-medium mt-0.5">Rescued Units</div>
        </div>
        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/60">
          <div className="text-lg font-black text-[#205B43]">{organizationsSupportedCount}</div>
          <div className="text-[11px] text-[#718078] font-medium mt-0.5">Shelters Supported</div>
        </div>
        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/60">
          <div className="text-lg font-black text-[#205B43]">{summary.foodCategoriesCount || 0}</div>
          <div className="text-[11px] text-[#718078] font-medium mt-0.5">Food Categories</div>
        </div>
      </div>

      {/* Recent Chronological Timeline */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#718078]">
          Recent Verified Contributions Timeline
        </h4>

        {recentTimeline?.length > 0 ? (
          <div className="space-y-2.5">
            {recentTimeline.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-stone-200/70 bg-[#F8FAF8] flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#26332D]">{item.foodTitle}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-200 text-[#718078]">
                      {item.contributionId}
                    </span>
                  </div>
                  <div className="text-[#718078] text-[11px]">
                    <strong className="text-[#205B43]">{item.quantity} {item.unit}</strong> handed over to{' '}
                    <strong className="text-[#26332D]">{item.recipientName}</strong>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF4EE] text-[#205B43]">
                    Verified ✓
                  </span>
                  <div className="text-[10px] text-[#718078] mt-0.5">
                    {new Date(item.verifiedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 text-center text-xs text-[#718078]">
            No verified handovers completed yet. Once a recipient or volunteer confirms food receipt, your contributions will record automatically here.
          </div>
        )}
      </div>

      {/* Full History Modal */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title="Verified Contributions History"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#F8FAF8] border border-stone-200/70 text-xs">
            <span className="font-bold text-[#26332D] flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Records:</span>
            </span>
            <div className="flex items-center space-x-2">
              <select
                value={historyFilter.status}
                onChange={(e) => setHistoryFilter({ ...historyFilter, status: e.target.value })}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs bg-white text-[#26332D]"
              >
                <option value="">All Statuses</option>
                <option value="VERIFIED">Verified</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="REVERSED">Reversed</option>
              </select>

              <select
                value={historyFilter.category}
                onChange={(e) => setHistoryFilter({ ...historyFilter, category: e.target.value })}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs bg-white text-[#26332D]"
              >
                <option value="">All Categories</option>
                <option value="cooked_meals">Cooked Meals</option>
                <option value="bakery_items">Bakery</option>
                <option value="raw_groceries">Raw Groceries</option>
                <option value="packaged_food">Packaged Food</option>
                <option value="fruits_vegetables">Fruits & Veg</option>
                <option value="dairy_beverages">Dairy & Beverages</option>
              </select>
            </div>
          </div>

          {/* Records Table */}
          {historyLoading ? (
            <div className="py-8 text-center text-xs text-[#718078]">Loading contribution records...</div>
          ) : historyRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-[#718078]">
                    <th className="py-2.5 px-3">Contribution ID</th>
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3">Recipient Shelter</th>
                    <th className="py-2.5 px-3">Verified Date</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {historyRecords.map((rec) => (
                    <tr key={rec._id} className="hover:bg-stone-50/70">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#205B43]">
                        {rec.contributionId}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#26332D]">{rec.foodTitle}</td>
                      <td className="py-2.5 px-3 font-bold text-[#205B43]">{rec.quantity} {rec.unit}</td>
                      <td className="py-2.5 px-3 text-[#718078]">{rec.recipientOrg?.name || 'Verified Recipient'}</td>
                      <td className="py-2.5 px-3 text-[#718078]">
                        {new Date(rec.verifiedAt).toLocaleDateString([], {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rec.status === 'VERIFIED'
                              ? 'bg-[#EAF4EE] text-[#205B43]'
                              : rec.status === 'UNDER_REVIEW'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#718078]">
              No contribution records matching the selected filter.
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#718078] bg-stone-100 hover:bg-stone-200"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
