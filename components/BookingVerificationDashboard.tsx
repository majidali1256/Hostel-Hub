import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Calendar, User, Phone, CreditCard, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import CancellationModal from './CancellationModal';

interface Booking {
    id: string;
    hostelId: {
        name: string;
        location: string;
    };
    customerId: {
        firstName: string;
        lastName: string;
        email: string;
        contactNumber: string;
    };
    checkIn: string;
    checkOut: string;
    numberOfGuests: number;
    totalPrice: number;
    status: string;
    paymentStatus: string;
    paymentMethod?: string;
    transactionId?: string;
    paymentReceipt?: {
        image: string;
        uploadedAt: string;
        verified: boolean;
        rejectionReason?: string;
    };
    createdAt: string;
}

const BookingVerificationDashboard: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setError(null);
            const token = localStorage.getItem('token');

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const response = await axios.get(
                `${apiUrl}/api/bookings/my-hostel-bookings`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setBookings(response.data);
        } catch (error: any) {
            console.error('Error fetching bookings:', error);
            if (error.response?.status === 401) {
                setError('Booking system requires backend authentication. This feature is currently in development.');
            } else {
                setError(error.response?.data?.error || 'Failed to load bookings. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyPayment = async (bookingId: string, approved: boolean) => {
        setProcessingId(bookingId);
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            await axios.put(
                `${apiUrl}/api/bookings/${bookingId}/verify-payment`,
                { approved, rejectionReason: approved ? undefined : rejectionReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refresh bookings
            await fetchBookings();
            setShowReceiptModal(false);
            setSelectedBooking(null);
            setRejectionReason('');

            alert(approved ? 'Payment approved! Booking confirmed.' : 'Payment rejected.');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to verify payment');
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancelBooking = async (reason: string) => {
        if (!selectedBooking) return;

        setCancelLoading(true);
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            await axios.post(
                `${apiUrl}/api/bookings/${selectedBooking.id}/cancel`,
                { reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refresh bookings
            await fetchBookings();
            setShowCancelModal(false);
            setSelectedBooking(null);
            alert('Booking cancelled successfully');
        } catch (error: any) {
            console.error('Error cancelling booking:', error);
            alert(error.response?.data?.error || 'Failed to cancel booking');
        } finally {
            setCancelLoading(false);
        }
    };

    const pendingBookings = bookings.filter(b => b.paymentStatus === 'submitted' && b.status !== 'cancelled');
    const confirmedBookings = bookings.filter(b => b.paymentStatus === 'verified' && b.status !== 'cancelled');
    const rejectedBookings = bookings.filter(b => b.paymentStatus === 'rejected');

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-3 text-lg text-gray-700 dark:text-gray-300">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Loading bookings...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto p-4 md:p-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                    <h2 className="text-xl md:text-2xl font-bold text-red-800 dark:text-red-200 mb-2">Error Loading Bookings</h2>
                    <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                    <button
                        onClick={fetchBookings}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">📋 Booking Management</h1>

            {/* Pending Payments Section */}
            <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                    ⏳ Pending Payment Verification
                    {pendingBookings.length > 0 && (
                        <span className="bg-orange-500 text-white text-sm px-3 py-1 rounded-full">
                            {pendingBookings.length}
                        </span>
                    )}
                </h2>

                {pendingBookings.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                        No pending payment verifications
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {pendingBookings.map(booking => (
                            <div key={booking.id} className="bg-white dark:bg-gray-800 border-2 border-orange-200 dark:border-orange-700 rounded-lg p-4 md:p-6 shadow-sm">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-4">
                                    <div>
                                        <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">{booking.hostelId.name}</h3>
                                        <p className="text-gray-600 dark:text-gray-400">{booking.hostelId.location}</p>
                                    </div>
                                    <div className="md:text-right">
                                        <div className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
                                            PKR {booking.totalPrice.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 text-sm text-gray-700 dark:text-gray-300">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-500" />
                                        <span className="font-semibold">Customer:</span> {booking.customerId.firstName} {booking.customerId.lastName}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-500" />
                                        <span className="font-semibold">Contact:</span> {booking.customerId.contactNumber}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-gray-500" />
                                        <span className="font-semibold">Payment:</span> {booking.paymentMethod?.replace('_', ' ').toUpperCase()}
                                    </div>
                                    {booking.transactionId && (
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">Transaction:</span> {booking.transactionId}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                    <button
                                        onClick={() => {
                                            setSelectedBooking(booking);
                                            setShowReceiptModal(true);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                                    >
                                        <Eye className="w-4 h-4" /> View Receipt
                                    </button>
                                    <button
                                        onClick={() => handleVerifyPayment(booking.id, true)}
                                        disabled={processingId === booking.id}
                                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <CheckCircle className="w-4 h-4" /> Approve
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedBooking(booking);
                                            setShowReceiptModal(true);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                                    >
                                        <XCircle className="w-4 h-4" /> Reject
                                    </button>
                                </div>
                                <div className="mt-3 text-right">
                                    <button
                                        onClick={() => {
                                            setSelectedBooking(booking);
                                            setShowCancelModal(true);
                                        }}
                                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium hover:underline"
                                    >
                                        Cancel Booking
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Confirmed Bookings */}
            <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                    ✅ Confirmed Bookings ({confirmedBookings.length})
                </h2>
                {confirmedBookings.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                        No confirmed bookings
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {confirmedBookings.map(booking => (
                            <div key={booking.id} className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-lg p-4">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{booking.hostelId.name}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {booking.customerId.firstName} {booking.customerId.lastName} •
                                            {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                                        </p>
                                    </div>
                                    <div className="sm:text-right">
                                        <div className="font-bold text-green-600 dark:text-green-400">PKR {booking.totalPrice.toLocaleString()}</div>
                                        <div className="text-xs text-green-600 dark:text-green-400 mb-1 flex items-center gap-1 sm:justify-end">
                                            <CheckCircle className="w-3 h-3" /> Confirmed
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedBooking(booking);
                                                setShowCancelModal(true);
                                            }}
                                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs font-medium hover:underline"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Receipt Modal */}
            {showReceiptModal && selectedBooking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4 md:p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Payment Receipt</h2>
                                <button
                                    onClick={() => {
                                        setShowReceiptModal(false);
                                        setSelectedBooking(null);
                                        setRejectionReason('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="mb-4 space-y-2 text-gray-700 dark:text-gray-300">
                                <p><strong>Customer:</strong> {selectedBooking.customerId.firstName} {selectedBooking.customerId.lastName}</p>
                                <p><strong>Amount:</strong> PKR {selectedBooking.totalPrice.toLocaleString()}</p>
                                <p><strong>Payment Method:</strong> {selectedBooking.paymentMethod?.replace('_', ' ').toUpperCase()}</p>
                                {selectedBooking.transactionId && (
                                    <p><strong>Transaction ID:</strong> {selectedBooking.transactionId}</p>
                                )}
                            </div>

                            {selectedBooking.paymentReceipt?.image && (
                                <div className="mb-4">
                                    <img
                                        src={selectedBooking.paymentReceipt.image}
                                        alt="Payment Receipt"
                                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
                                    />
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                    Rejection Reason (if rejecting)
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Enter reason for rejection..."
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => handleVerifyPayment(selectedBooking.id, true)}
                                    disabled={processingId === selectedBooking.id}
                                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    {processingId === selectedBooking.id ? 'Processing...' : 'Approve Payment'}
                                </button>
                                <button
                                    onClick={() => handleVerifyPayment(selectedBooking.id, false)}
                                    disabled={processingId === selectedBooking.id || !rejectionReason}
                                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <XCircle className="w-5 h-5" />
                                    {processingId === selectedBooking.id ? 'Processing...' : 'Reject Payment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancellation Modal */}
            <CancellationModal
                isOpen={showCancelModal}
                onClose={() => {
                    setShowCancelModal(false);
                    setSelectedBooking(null);
                }}
                onConfirm={handleCancelBooking}
                isLoading={cancelLoading}
                isOwner={true}
            />
        </div>
    );
};

export default BookingVerificationDashboard;
