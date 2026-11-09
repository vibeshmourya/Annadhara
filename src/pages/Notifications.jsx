import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Clock, CheckCircle2, AlertCircle, CalendarCheck, Truck, ShieldCheck } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { LoadingSpinner, EmptyState } from '../components/common/StatCard';

export const Notifications = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  const getIcon = (type) => {
    switch (type) {
      case 'reservation_request':
      case 'reservation_approved':
        return <CalendarCheck className="w-5 h-5 text-[#2E7D5B]" />;
      case 'pickup_assigned':
      case 'pickup_collected':
      case 'pickup_completed':
        return <Truck className="w-5 h-5 text-indigo-600" />;
      case 'handover_success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'org_verification':
        return <ShieldCheck className="w-5 h-5 text-[#2E7D5B]" />;
      default:
        return <Bell className="w-5 h-5 text-[#718078]" />;
    }
  };

  if (loading && notifications.length === 0) {
    return <LoadingSpinner text="Loading notifications..." />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-[#26332D] tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#D9534F] text-white">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-[#718078] mt-1">
            Stay updated with donation requests, pickup milestones, and handover confirmations.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#205B43] bg-[#EAF4EE] hover:bg-[#2E7D5B]/20 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => !notif.isRead && markAsRead(notif._id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3.5 ${
                notif.isRead
                  ? 'bg-white border-stone-200/80'
                  : 'bg-[#F2F8F4] border-[#2E7D5B]/30 shadow-xs'
              }`}
            >
              <div className="p-2 rounded-xl bg-white border border-stone-200/60 shadow-xs shrink-0">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#26332D]">{notif.title}</h4>
                  <span className="text-[11px] text-[#718078]">
                    {new Date(notif.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-[#718078] mt-1 leading-relaxed">{notif.message}</p>

                {notif.actionUrl && (
                  <Link
                    to={notif.actionUrl}
                    className="inline-block mt-2 text-xs font-bold text-[#2E7D5B] hover:underline"
                  >
                    View Details →
                  </Link>
                )}
              </div>

              {!notif.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D5B] shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="You will receive alerts here when reservations are requested, approved, or handed over."
        />
      )}
    </div>
  );
};

