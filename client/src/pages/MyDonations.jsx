import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  CalendarCheck,
  ShieldCheck,
  KeyRound,
  XCircle,
  Edit,
  Eye,
  Filter,
} from 'lucide-react';
import { donationApi, reservationApi } from '../api/endpoints';
import { StatusBadge, CategoryBadge } from '../components/common/Badge';
import { HandoverModal } from '../components/handover/HandoverModal';
import { LoadingSpinner, EmptyState } from '../components/common/StatCard';
import { ConfirmationDialog, Modal } from '../components/common/Modal';

export const MyDonations = () => {
  const [donations, setDonations] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'requests'
  const [statusFilter, setStatusFilter] = useState('all');

  // Handover modal state
  const [selectedReservationForHandover, setSelectedReservationForHandover] = useState(null);

  // Request approval state
  const [selectedReq, setSelectedReq] = useState(null);
  const [reqAction, setReqAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Cancel donation state
  const [selectedDonationForCancel, setSelectedDonationForCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Edit donation modal state
  const [editingDonation, setEditingDonation] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    totalQuantity: '',
    storageHandling: '',
    allergens: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

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

  const handleCancelDonation = async () => {
    if (!selectedDonationForCancel) return;
    try {
      setCancelLoading(true);
      await donationApi.cancel(selectedDonationForCancel._id);
      setSelectedDonationForCancel(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel donation');
    } finally {
      setCancelLoading(false);
    }
  };

  const openEditModal = (item) => {
    setEditingDonation(item);
    setEditFormData({
      title: item.title,
      description: item.description || '',
      totalQuantity: item.totalQuantity,
      storageHandling: item.storageHandling || 'hot_held',
      allergens: Array.isArray(item.allergens) ? item.allergens.join(', ') : '',
    });
    setEditError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingDonation) return;
    try {
      setEditLoading(true);
      setEditError('');
      const payload = {
        title: editFormData.title,
        description: editFormData.description,
        totalQuantity: Number(editFormData.totalQuantity),
        storageHandling: editFormData.storageHandling,
        allergens: editFormData.allergens
          ? editFormData.allergens.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      const res = await donationApi.update(editingDonation._id, payload);
      if (res.data.success) {
        setEditingDonation(null);
        fetchData();
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to save updates');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading your listings..." />;

  const pendingRequestsCount = reservations.filter((r) => r.status === 'pending').length;

  const filteredDonations = donations.filter((d) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return d.status === 'available' || d.status === 'partially_reserved';
    if (statusFilter === 'completed') return d.status === 'completed';
    if (statusFilter === 'cancelled') return d.status === 'cancelled';
    return true;
  });

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
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-xs transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish New Food</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-[#E3EAE5]">
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
          {/* Status filter pills */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#718078] font-semibold flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
            </span>
            {['all', 'active', 'completed', 'cancelled'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-full font-semibold capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-[#2E7D5B] text-white'
                    : 'bg-white border border-[#E3EAE5] text-[#718078] hover:bg-stone-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {filteredDonations.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredDonations.map((item) => {
                const canEdit = item.status === 'available' || item.status === 'partially_reserved';
                const canCancel = item.status !== 'completed' && item.status !== 'cancelled' && item.collectedQuantity === 0;

                return (
                  <div
                    key={item._id}
                    className="bg-white rounded-2xl p-5 border border-[#E3EAE5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={item.status} />
                        <CategoryBadge category={item.category} />
                        <span className="text-xs text-[#718078]">
                          Pickup Window: Until {new Date(item.pickupEndTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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

                    <div className="flex flex-wrap md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/donations/${item._id}`}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#26332D] bg-[#F8FAF8] border border-[#E3EAE5] hover:bg-stone-100 transition-colors flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#718078]" />
                          <span>View</span>
                        </Link>

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#205B43] bg-[#EAF4EE] hover:bg-[#2E7D5B]/20 transition-colors flex items-center space-x-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        )}

                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => setSelectedDonationForCancel(item)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#D9534F] bg-red-50 hover:bg-red-100 transition-colors flex items-center space-x-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No food listings found"
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
                  className="bg-white rounded-2xl p-5 border border-[#E3EAE5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={res.status} />
                      <span className="text-xs font-bold text-[#26332D]">{res.recipient?.name}</span>
                      {res.recipientOrg && (
                        <span className="text-[11px] text-[#718078]">({res.recipientOrg.organizationName || res.recipientOrg.name})</span>
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
                          className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-xs transition-colors"
                        >
                          Approve Request
                        </button>
                      </>
                    )}

                    {res.status === 'approved' && (
                      <button
                        type="button"
                        onClick={() => setSelectedReservationForHandover(res)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-xs flex items-center space-x-1.5"
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

                    {res.status === 'cancelled' && (
                      <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-3 py-1 rounded-xl">
                        Cancelled
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

      {/* Edit Donation Modal */}
      {editingDonation && (
        <Modal
          isOpen={!!editingDonation}
          onClose={() => setEditingDonation(null)}
          title={`Edit Donation: ${editingDonation.title}`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            {editError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#D9534F]">
                {editError}
              </div>
            )}

            <div>
              <label className="block font-bold text-[#26332D] mb-1">Title *</label>
              <input
                type="text"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#26332D] mb-1">Description</label>
              <textarea
                rows={3}
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#26332D] mb-1">Total Quantity ({editingDonation.unit}) *</label>
                <input
                  type="number"
                  min="1"
                  value={editFormData.totalQuantity}
                  onChange={(e) => setEditFormData({ ...editFormData, totalQuantity: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#26332D] mb-1">Storage Condition</label>
                <select
                  value={editFormData.storageHandling}
                  onChange={(e) => setEditFormData({ ...editFormData, storageHandling: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D]"
                >
                  <option value="hot_held">Hot Held</option>
                  <option value="refrigerated">Refrigerated</option>
                  <option value="room_temperature">Room Temperature</option>
                  <option value="frozen">Frozen</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#26332D] mb-1">Allergens</label>
              <input
                type="text"
                value={editFormData.allergens}
                onChange={(e) => setEditFormData({ ...editFormData, allergens: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-[#E3EAE5]">
              <button
                type="button"
                onClick={() => setEditingDonation(null)}
                className="px-4 py-2 rounded-xl text-stone-600 bg-stone-100 hover:bg-stone-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="px-4 py-2 rounded-xl font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43] flex items-center space-x-1"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cancel Donation Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!selectedDonationForCancel}
        onClose={() => setSelectedDonationForCancel(null)}
        onConfirm={handleCancelDonation}
        title="Cancel Food Donation"
        message={`Are you sure you want to cancel "${selectedDonationForCancel?.title}"? This listing will be immediately removed from recipient food discovery.`}
        confirmText="Cancel Donation"
        isDanger={true}
        isLoading={cancelLoading}
      />

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
            ? `Approve ${selectedReq?.requestedQuantity} ${selectedReq?.unit} for ${selectedReq?.recipient?.name}? A volunteer pickup mission will be generated automatically.`
            : `Decline this request? The quantity will immediately return to your available surplus food pool.`
        }
        confirmText={reqAction === 'approved' ? 'Approve' : 'Decline'}
        isDanger={reqAction === 'rejected'}
        isLoading={actionLoading}
      />
    </div>
  );
};
