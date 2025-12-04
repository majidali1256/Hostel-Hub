import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg">Loading bookings...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h2 className="text-2xl font-bold text-red-800 mb-2">Error Loading Bookings</h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={fetchBookings}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">📋 Booking Management</h1>

            {/* Pending Payments Section */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    ⏳ Pending Payment Verification
                    {pendingBookings.length > 0 && (
                        <span className="bg-orange-500 text-white text-sm px-3 py-1 rounded-full">
                            {pendingBookings.length}
                        </span>
                    )}
                </h2>

                {pendingBookings.length === 0 ? (
                    <div className="bg-gray-50 p-8 rounded-lg text-center text-gray-500">
                        No pending payment verifications
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {pendingBookings.map(booking => (
                            <div key={booking.id} className="bg-white border-2 border-orange-200 rounded-lg p-6 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-semibold">{booking.hostelId.name}</h3>
                                        <p className="text-gray-600">{booking.hostelId.location}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-green-600">
                                            PKR {booking.totalPrice.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                    <div>
                                        <span className="font-semibold">Customer:</span> {booking.customerId.firstName} {booking.customerId.lastName}
                                    </div>
                                    <div>
                                        <span className="font-semibold">Contact:</span> {booking.customerId.contactNumber}
                                    </div>
                                    <div>
                                        <span className="font-semibold">Payment Method:</span> {booking.paymentMethod?.replace('_', ' ').toUpperCase()}
                                    </div>
                                    {booking.transactionId && (
                                        <div>
                                            <span className="font-semibold">Transaction ID:</span> {booking.transactionId}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setSelectedBooking(booking);
                                            setShowReceiptModal(true);
                                        }}
                                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                                    >
                                        📷 View Receipt
                                    </button>
                                    <button
                                        onClick={() => handleVerifyPayment(booking.id, true)}
                                        disabled={processingId === booking.id}
                                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                    >
                                        ✓ Approve
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedBooking(booking);
                                            setShowReceiptModal(true);
                                        }}
                                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition"
                                    >
                                        ✗ Reject
                                    </button>
                                </div>
                                <div className="mt-3 text-right">
                                    <button
                                        onClick={() => {
                                            setSelectedBooking(booking);
                                            setShowCancelModal(true);
                                        }}
                                        className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline"
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
                <h2 className="text-2xl font-semibold mb-4">✅ Confirmed Bookings ({confirmedBookings.length})</h2>
                {confirmedBookings.length === 0 ? (
                    <div className="bg-gray-50 p-8 rounded-lg text-center text-gray-500">
                        No confirmed bookings
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {confirmedBookings.map(booking => (
                            <div key={booking.id} className="bg-white border border-green-200 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold">{booking.hostelId.name}</h3>
                                        <p className="text-sm text-gray-600">
                                            {booking.customerId.firstName} {booking.customerId.lastName} •
                                            {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-green-600">PKR {booking.totalPrice.toLocaleString()}</div>
                                        <div className="text-xs text-green-600 mb-1">✓ Confirmed</div>
                                        <button
                                            onClick={() => {
                                                setSelectedBooking(booking);
                                                setShowCancelModal(true);
                                            }}
                                            className="text-red-600 hover:text-red-800 text-xs font-medium hover:underline"
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-2xl font-bold">Payment Receipt</h2>
                                <button
                                    onClick={() => {
                                        setShowReceiptModal(false);
                                        setSelectedBooking(null);
                                        setRejectionReason('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mb-4">
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
                                        className="w-full rounded-lg border"
                                    />
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    Rejection Reason (if rejecting)
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full p-3 border rounded-lg"
                                    rows={3}
                                    placeholder="Enter reason for rejection..."
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleVerifyPayment(selectedBooking.id, true)}
                                    disabled={processingId === selectedBooking.id}
                                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                >
                                    {processingId === selectedBooking.id ? 'Processing...' : '✓ Approve Payment'}
                                </button>
                                <button
                                    onClick={() => handleVerifyPayment(selectedBooking.id, false)}
                                    disabled={processingId === selectedBooking.id || !rejectionReason}
                                    className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                                >
                                    {processingId === selectedBooking.id ? 'Processing...' : '✗ Reject Payment'}
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
