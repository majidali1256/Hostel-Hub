import React, { useState, useEffect } from 'react';
import { api } from '../services/mongoService';
import { useToast } from '../contexts/ToastContext';
import CancellationModal from './CancellationModal';
import PaymentReceiptUpload from './PaymentReceiptUpload';

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
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentStep, setPaymentStep] = useState<'instructions' | 'upload'>('instructions');
    const toast = useToast();

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
            toast.showSuccess('Booking cancelled successfully');
        } catch (error: any) {
            console.error('Error cancelling booking:', error);
            toast.showError(error.message || 'Failed to cancel booking');
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
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-3 animate-pulse">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Loading your bookings...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center animate-fade-in">
                    <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">Error</h2>
                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <button
                        onClick={fetchBookings}
                        className="bg-red-600 text-white px-6 py-2.5 rounded-xl hover:bg-red-700 transition-all duration-200 font-medium shadow-sm shadow-red-500/20 active:scale-95"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const filteredBookings = filterBookings();

    return (
        <div className="max-w-7xl mx-auto p-6 animate-fade-in">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">📚 My Bookings</h1>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {['all', 'upcoming', 'past', 'cancelled'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${filter === f
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        {f === 'all' && ` (${bookings.length})`}
                    </button>
                ))}
            </div>

            {/* Bookings List */}
            {filteredBookings.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-800 p-12 rounded-2xl text-center border border-gray-200 dark:border-gray-700 animate-fade-in">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No bookings found</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredBookings.map((booking, index) => (
                        <div key={booking._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 animate-stagger-in" style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-4">
                                    {booking.hostelId.images && booking.hostelId.images[0] && (
                                        <img
                                            src={booking.hostelId.images[0]}
                                            alt={booking.hostelId.name}
                                            className="w-24 h-24 object-cover rounded-xl"
                                        />
                                    )}
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{booking.hostelId.name}</h3>
                                        <p className="text-gray-600 dark:text-gray-400">{booking.hostelId.location}</p>
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
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        PKR {booking.totalPrice.toLocaleString()}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t border-gray-200 dark:border-gray-700 pt-4">
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Guests:</span>
                                    <p className="font-medium text-gray-900 dark:text-white">{booking.numberOfGuests}</p>
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

                            {/* Confirm Booking Button - for pending payment bookings */}
                            {booking.paymentStatus === 'pending' && booking.status === 'pending' && (
                                <div className="mt-4 border-t pt-4">
                                    <button
                                        onClick={() => {
                                            setSelectedBooking(booking);
                                            setPaymentStep('instructions');
                                            setShowPaymentModal(true);
                                        }}
                                        className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"
                                    >
                                        💳 Confirm Booking & Pay
                                    </button>
                                    <p className="text-sm text-gray-500 mt-2 text-center">
                                        Click to view bank details and submit payment proof
                                    </p>
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in border border-gray-100 dark:border-gray-700">
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

            {/* Payment Modal */}
            {showPaymentModal && selectedBooking && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in border border-gray-100 dark:border-gray-700">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {paymentStep === 'instructions' ? '💳 Payment Instructions' : '📤 Upload Payment Proof'}
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                                        Booking: {selectedBooking.hostelId.name}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowPaymentModal(false);
                                        setSelectedBooking(null);
                                        setPaymentStep('instructions');
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Progress Steps */}
                            <div className="flex items-center justify-center gap-4 mb-6">
                                <div className={`flex items-center gap-2 ${paymentStep === 'instructions' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`}>
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center ${paymentStep === 'instructions' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>1</span>
                                    <span className="font-medium">Bank Details</span>
                                </div>
                                <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700">
                                    <div className={`h-full bg-blue-600 transition-all ${paymentStep === 'upload' ? 'w-full' : 'w-0'}`} />
                                </div>
                                <div className={`flex items-center gap-2 ${paymentStep === 'upload' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center ${paymentStep === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600'}`}>2</span>
                                    <span className="font-medium">Upload Proof</span>
                                </div>
                            </div>

                            {paymentStep === 'instructions' ? (
                                <>
                                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
                                        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">Payment Details</h3>
                                        <div className="space-y-3 text-gray-700 dark:text-gray-300">
                                            <p><strong>Amount:</strong> PKR {selectedBooking.totalPrice.toLocaleString()}</p>
                                            <p><strong>Hostel:</strong> {selectedBooking.hostelId.name}</p>
                                            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mt-4">
                                                <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">⚠️ Payment Instructions:</p>
                                                <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                                                    <li>Contact the hostel owner for bank details</li>
                                                    <li>Make the payment via bank transfer, JazzCash, or EasyPaisa</li>
                                                    <li>Keep your payment receipt/screenshot</li>
                                                    <li>Click "Next" to upload your payment proof</li>
                                                </ol>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex gap-3">
                                        <button
                                            onClick={() => setPaymentStep('upload')}
                                            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition font-semibold"
                                        >
                                            I've Made the Payment → Upload Proof
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <PaymentReceiptUpload
                                        bookingId={selectedBooking._id}
                                        onSuccess={() => {
                                            setShowPaymentModal(false);
                                            setSelectedBooking(null);
                                            setPaymentStep('instructions');
                                            setPaymentStep('instructions');
                                            fetchBookings(); // Refresh the list
                                            toast.showSuccess('Payment proof submitted! The owner will verify your payment.');
                                        }}
                                        onCancel={() => {
                                            setShowPaymentModal(false);
                                            setSelectedBooking(null);
                                            setPaymentStep('instructions');
                                        }}
                                    />
                                    <div className="mt-4">
                                        <button
                                            onClick={() => setPaymentStep('instructions')}
                                            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                        >
                                            ← Back to bank details
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingHistory;
