import React, { useState, useEffect } from 'react';
import { api } from '../services/mongoService';
import CancellationModal from './CancellationModal';

interface Booking {
    _id: string;
    hostelId: {
        name: string;
        location: string;
        images: string[];
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

const BookingHistory: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setError(null);
            const data = await api.bookings.getMyBookings();
            setBookings(data);
        } catch (error: any) {
            console.error('Error fetching bookings:', error);
            setError(error.message || 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (reason: string) => {
        if (!selectedBooking) return;

        setCancelLoading(true);
        try {
            await api.bookings.cancel(selectedBooking._id, reason);

            // Update local state
            setBookings(bookings.map(b =>
                b._id === selectedBooking._id ? { ...b, status: 'cancelled' } : b
            ));
            setShowCancelModal(false);
            setSelectedBooking(null);
            alert('Booking cancelled successfully');
        } catch (error: any) {
            console.error('Error cancelling booking:', error);
            alert(error.message || 'Failed to cancel booking');
        } finally {
            setCancelLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'verified': return 'bg-green-100 text-green-800';
            case 'submitted': return 'bg-blue-100 text-blue-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filterBookings = () => {
        const now = new Date();
        switch (filter) {
            case 'upcoming':
                return bookings.filter(b => new Date(b.checkIn) > now && b.status !== 'cancelled');
            case 'past':
                return bookings.filter(b => new Date(b.checkOut) < now);
            case 'cancelled':
                return bookings.filter(b => b.status === 'cancelled');
            default:
                return bookings;
        }
    };

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
                <div className="text-lg">Loading your bookings...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h2 className="text-2xl font-bold text-red-800 mb-2">Error</h2>
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

    const filteredBookings = filterBookings();

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">📚 My Bookings</h1>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
                {['all', 'upcoming', 'past', 'cancelled'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${filter === f
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        {f === 'all' && ` (${bookings.length})`}
                    </button>
                ))}
            </div>

            {/* Bookings List */}
            {filteredBookings.length === 0 ? (
                <div className="bg-gray-50 p-12 rounded-lg text-center">
                    <p className="text-gray-500 text-lg">No bookings found</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredBookings.map(booking => (
                        <div key={booking._id} className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-4">
                                    {booking.hostelId.images && booking.hostelId.images[0] && (
                                        <img
                                            src={booking.hostelId.images[0]}
                                            alt={booking.hostelId.name}
                                            className="w-24 h-24 object-cover rounded-lg"
                                        />
                                    )}
                                    <div>
                                        <h3 className="text-xl font-semibold">{booking.hostelId.name}</h3>
                                        <p className="text-gray-600">{booking.hostelId.location}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                            <span className={`text-xs px-3 py-1 rounded-full ${getPaymentStatusColor(booking.paymentStatus)}`}>
                                                Payment: {booking.paymentStatus}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-green-600">
                                        PKR {booking.totalPrice.toLocaleString()}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t pt-4">
                                <div>
                                    <span className="text-gray-500">Guests:</span>
                                    <p className="font-medium">{booking.numberOfGuests}</p>
                                </div>
                                {booking.paymentMethod && (
                                    <div>
                                        <span className="text-gray-500">Payment Method:</span>
                                        <p className="font-medium">{booking.paymentMethod.replace('_', ' ').toUpperCase()}</p>
                                    </div>
                                )}
                                {booking.transactionId && (
                                    <div>
                                        <span className="text-gray-500">Transaction ID:</span>
                                        <p className="font-medium">{booking.transactionId}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-gray-500">Booked on:</span>
                                    <p className="font-medium">{formatDate(booking.createdAt)}</p>
                                </div>
                            </div>

                            {booking.paymentReceipt && (
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedBooking(booking);
                                            setShowReceiptModal(true);
                                        }}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                                    >
                                        📷 View Receipt
                                    </button>
                                    {booking.paymentStatus === 'rejected' && booking.paymentReceipt.rejectionReason && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
                                            <strong>Rejected:</strong> {booking.paymentReceipt.rejectionReason}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Cancel Button */}
                            {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                <div className="mt-4 flex justify-end">
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
                            )}
                        </div>
                    ))}
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
            />

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
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mb-4">
                                <p><strong>Hostel:</strong> {selectedBooking.hostelId.name}</p>
                                <p><strong>Amount:</strong> PKR {selectedBooking.totalPrice.toLocaleString()}</p>
                                <p><strong>Payment Method:</strong> {selectedBooking.paymentMethod?.replace('_', ' ').toUpperCase()}</p>
                                {selectedBooking.transactionId && (
                                    <p><strong>Transaction ID:</strong> {selectedBooking.transactionId}</p>
                                )}
                                <p><strong>Status:</strong> <span className={`px-2 py-1 rounded ${getPaymentStatusColor(selectedBooking.paymentStatus)}`}>
                                    {selectedBooking.paymentStatus}
                                </span></p>
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

                            {selectedBooking.paymentStatus === 'rejected' && selectedBooking.paymentReceipt?.rejectionReason && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                                    <strong>Rejection Reason:</strong> {selectedBooking.paymentReceipt.rejectionReason}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingHistory;
