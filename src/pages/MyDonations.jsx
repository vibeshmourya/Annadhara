import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, PlusCircle, Clock, CheckCircle2, AlertCircle, CalendarCheck, ShieldCheck, KeyRound } from 'lucide-react';
import { donationApi, reservationApi } from '../api/endpoints';
import { StatusBadge, CategoryBadge } from '../components/common/Badge';
import { HandoverModal } from '../components/handover/HandoverModal';
import { LoadingSpinner, EmptyState } from '../components/common/StatCard';
import { ConfirmationDialog } from '../components/common/Modal';

export const MyDonations = () => {
  const [donations, setDonations] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'requests'

  // Handover modal state
  const [selectedReservationForHandover, setSelectedReservationForHandover] = useState(null);

  // Request approval state
  const [selectedReq, setSelectedReq] = useState(null);
  const [reqAction, setReqAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [donRes, resRes] = await Promise.all([
        donationApi.getMyDonations(),
        reservationApi.getAll(),
      ]);

      if (donRes.data.success) {
        setDonations(donRes.data.data);
      }
      if (resRes.data.success) {
        setReservations(resRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching donor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveOrReject = async () => {
    if (!selectedReq || !reqAction) return;
    try {
      setActionLoading(true);
      await reservationApi.updateStatus(selectedReq._id, {
        status: reqAction,
        donorNotes: reqAction === 'approved' ? 'Approved by donor' : 'Declined by donor',
      });
      setSelectedReq(null);
      setReqAction(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading your listings..." />;

  const pendingRequestsCount = reservations.filter((r) => r.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26332D] tracking-tight">
            My Food Donations
          </h1>
          <p className="text-xs sm:text-sm text-[#718078] mt-1">
            Manage your surplus listings, review recipient requests, and confirm zero-waste food handovers.
          </p>
        </div>

        <Link
          to="/create-donation"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish New Food</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-stone-200">
        <button
          type="button"
          onClick={() => setActiveTab('listings')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeTab === 'listings'
              ? 'text-[#205B43] border-b-2 border-[#2E7D5B]'
              : 'text-[#718078] hover:text-[#26332D]'
          }`}
        >
          <span>Published Listings ({donations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center space-x-1.5 ${
            activeTab === 'requests'
              ? 'text-[#205B43] border-b-2 border-[#2E7D5B]'
              : 'text-[#718078] hover:text-[#26332D]'
          }`}
        >
          <span>Incoming Requests ({reservations.length})</span>
          {pendingRequestsCount > 0 && (
            <span className="bg-[#E9A23B] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {pendingRequestsCount} new
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Published Listings */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          {donations.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {donations.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={item.status} />
                      <CategoryBadge category={item.category} />
                      <span className="text-xs text-[#718078]">
                        Until {new Date(item.pickupEndTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#26332D]">{item.title}</h3>
                    <p className="text-xs text-[#718078] line-clamp-1">{item.description}</p>

                    {/* Progress Inventory Bar */}
                    <div className="space-y-1 max-w-md pt-1">
                      <div className="flex justify-between text-[11px] font-semibold text-[#718078]">
                        <span>Available: {item.availableQuantity} {item.unit}</span>
                        <span>Reserved: {item.reservedQuantity} {item.unit}</span>
                        <span>Collected: {item.collectedQuantity} {item.unit}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden flex">
                        <div
                          style={{ width: `${(item.collectedQuantity / item.totalQuantity) * 100}%` }}
                          className="bg-[#2E7D5B] h-full"
                          title="Collected"
                        />
                        <div
                          style={{ width: `${(item.reservedQuantity / item.totalQuantity) * 100}%` }}
                          className="bg-[#E9A23B] h-full"
                          title="Reserved"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0">
                    <Link
                      to={`/donations/${item._id}`}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-[#26332D] bg-stone-100 hover:bg-stone-200 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No food listings published yet"
              description="Help eliminate food waste by publishing surplus meals or fresh produce from your kitchen."
              action={
                <Link
                  to="/create-donation"
                  className="px-4 py-2 bg-[#2E7D5B] text-white text-xs font-bold rounded-xl"
                >
                  Create Your First Donation
                </Link>
              }
            />
          )}
        </div>
      )}

      {/* Tab 2: Incoming Requests & Handover */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {reservations.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {reservations.map((res) => (
                <div
                  key={res._id}
                  className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={res.status} />
                      <span className="text-xs font-bold text-[#26332D]">{res.recipient?.name}</span>
                      {res.recipientOrg && (
                        <span className="text-[11px] text-[#718078]">({res.recipientOrg.name})</span>
                      )}
                    </div>

                    <p className="text-sm font-bold text-[#26332D]">
                      Requested: <span className="text-[#205B43]">{res.requestedQuantity} {res.unit}</span> of "{res.donation?.title}"
                    </p>

                    {res.requestNotes && (
                      <p className="text-xs text-[#718078] italic">"{res.requestNotes}"</p>
                    )}

                    <div className="text-[11px] text-[#718078] flex items-center space-x-3 pt-1">
                      <span>Requested: {new Date(res.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      {res.status === 'approved' && (
                        <span className="font-mono font-bold text-[#205B43] bg-[#EAF4EE] px-2 py-0.5 rounded">
                          Handover Code: {res.handoverCode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {res.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReq(res);
                            setReqAction('rejected');
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#D9534F] bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReq(res);
                            setReqAction('approved');
                          }}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-sm transition-colors"
                        >
                          Approve Request
                        </button>
                      </>
                    )}

                    {res.status === 'approved' && (
                      <button
                        type="button"
                        onClick={() => setSelectedReservationForHandover(res)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-sm flex items-center space-x-1.5"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Confirm Handover</span>
                      </button>
                    )}

                    {res.status === 'completed' && (
                      <span className="text-xs font-bold text-[#205B43] bg-[#EAF4EE] px-3 py-1 rounded-xl">
                        Handover Completed ✓
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No reservation requests yet"
              description="When recipient charities request your surplus food, their requests will appear here for one-click approval."
            />
          )}
        </div>
      )}

      {/* Handover Modal */}
      <HandoverModal
        isOpen={!!selectedReservationForHandover}
        onClose={() => setSelectedReservationForHandover(null)}
        reservation={selectedReservationForHandover}
        onHandoverSuccess={() => {
          fetchData();
        }}
      />

      {/* Approval / Decline Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!selectedReq}
        onClose={() => {
          setSelectedReq(null);
          setReqAction(null);
        }}
        onConfirm={handleApproveOrReject}
        title={reqAction === 'approved' ? 'Approve Reservation' : 'Decline Reservation'}
        message={
          reqAction === 'approved'
            ? `Approve ${selectedReq?.requestedQuantity} ${selectedReq?.unit} for ${selectedReq?.recipient?.name}? A pickup task will be generated.`
            : `Decline this request? The quantity will immediately return to your available surplus food.`
        }
        confirmText={reqAction === 'approved' ? 'Approve' : 'Decline'}
        isDanger={reqAction === 'rejected'}
        isLoading={actionLoading}
      />
    </div>
  );
};

