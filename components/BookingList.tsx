import React from 'react';
import { format } from 'date-fns';

export interface Booking {
    id: string;
    hostelId: any;
    customerId: any;
    checkIn: Date;
    checkOut: Date;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    totalPrice: number;
    numberOfGuests: number;
    specialRequests?: string;
    paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';
    createdAt: Date;
    confirmedAt?: Date;
    cancelledAt?: Date;
    cancelReason?: string;
}

interface BookingListProps {
    bookings: Booking[];
    userRole: 'customer' | 'owner';
    onConfirm?: (id: string) => void;
    onCancel?: (id: string) => void;
    onViewDetails?: (booking: Booking) => void;
}

const BookingList: React.FC<BookingListProps> = ({
    bookings,
    userRole,
    onConfirm,
    onCancel,
    onViewDetails
}) => {
    if (bookings.length === 0) {
        return (
            <div className="text-center py-12 animate-fade-in">
                <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No bookings</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {userRole === 'customer' ? 'You haven\'t made any bookings yet.' : 'No bookings for this property yet.'}
                </p>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
            case 'pending':
                return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
            case 'cancelled':
                return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
            case 'completed':
                return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
            default:
                return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'text-green-600';
            case 'partial':
                return 'text-yellow-600';
            case 'unpaid':
                return 'text-red-600';
            case 'refunded':
                return 'text-gray-600';
            default:
                return 'text-gray-600';
        }
    };

    return (
        <div className="space-y-4">
            {bookings.map((booking, index) => (
                <div
                    key={booking.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 animate-stagger-in"
                    style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {booking.hostelId?.name || 'Hostel'}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{booking.hostelId?.location}</p>
                        </div>
                        <div className="flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Check-in</p>
                            <p className="font-medium text-gray-900 dark:text-white">{format(new Date(booking.checkIn), 'MMM dd, yyyy')}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Check-out</p>
                            <p className="font-medium text-gray-900 dark:text-white">{format(new Date(booking.checkOut), 'MMM dd, yyyy')}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Guests</p>
                            <p className="font-medium text-gray-900 dark:text-white">{booking.numberOfGuests}</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Price</p>
                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">Rs {booking.totalPrice.toLocaleString()}</p>
                            <p className={`text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                                {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            {onViewDetails && (
                                <button
                                    onClick={() => onViewDetails(booking)}
                                    className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 active:scale-95"
                                >
                                    View Details
                                </button>
                            )}

                            {userRole === 'owner' && booking.status === 'pending' && onConfirm && (
                                <button
                                    onClick={() => onConfirm(booking.id)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all duration-200 shadow-sm shadow-green-500/20 active:scale-95"
                                >
                                    Confirm
                                </button>
                            )}

                            {booking.status !== 'cancelled' && booking.status !== 'completed' && onCancel && (
                                <button
                                    onClick={() => onCancel(booking.id)}
                                    className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 active:scale-95"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>

                    {booking.specialRequests && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Special Requests</p>
                            <p className="text-sm text-gray-700">{booking.specialRequests}</p>
                        </div>
                    )}

                    {userRole === 'owner' && booking.customerId && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Customer</p>
                            <p className="text-sm font-medium">
                                {booking.customerId.firstName} {booking.customerId.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{booking.customerId.email}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default BookingList;
