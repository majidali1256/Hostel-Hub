import React, { useState, useEffect } from 'react';
import { Hostel } from '../types';
import { useToast } from '../contexts/ToastContext';
import Button from './Button';
import Input from './Input';
import { format, differenceInDays, addDays } from 'date-fns';
import PaymentInstructions from './PaymentInstructions';
import PaymentReceiptUpload from './PaymentReceiptUpload';

interface BookingFormProps {
    hostel: Hostel;
    onSubmit: (booking: BookingRequest) => Promise<any>; // Returns booking response with bank details
    onClose: () => void;
}

interface BookingRequest {
    hostelId: string;
    checkIn: string;
    checkOut: string;
    numberOfGuests: number;
    specialRequests?: string;
}

const BookingForm: React.FC<BookingFormProps> = ({ hostel, onSubmit, onClose }) => {
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [numberOfGuests, setNumberOfGuests] = useState(1);
    const [specialRequests, setSpecialRequests] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalPrice, setTotalPrice] = useState(0);
    const [duration, setDuration] = useState(0);
    const toast = useToast();

    // Payment flow states
    const [bookingResponse, setBookingResponse] = useState<any>(null);
    const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);
    const [showReceiptUpload, setShowReceiptUpload] = useState(false);

    // Calculate price when dates change
    useEffect(() => {
        if (checkIn && checkOut) {
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);

            if (checkOutDate > checkInDate) {
                const days = differenceInDays(checkOutDate, checkInDate);
                setDuration(days);

                // Calculate price (price per month / 30 * days)
                const pricePerDay = hostel.price / 30;
                const total = Math.round(pricePerDay * days);
                setTotalPrice(total);
            } else {
                setDuration(0);
                setTotalPrice(0);
            }
        }
    }, [checkIn, checkOut, hostel.price]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!checkIn || !checkOut) {
            setError('Please select check-in and check-out dates');
            return;
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        if (checkInDate < new Date()) {
            setError('Check-in date must be in the future');
            return;
        }

        if (checkOutDate <= checkInDate) {
            setError('Check-out date must be after check-in date');
            return;
        }

        if (duration < 1) {
            setError('Minimum stay is 1 day');
            return;
        }

        setIsLoading(true);

        try {
            const response = await onSubmit({
                hostelId: hostel.id,
                checkIn,
                checkOut,
                numberOfGuests,
                specialRequests
            });

            // Store booking response and show payment instructions
            setBookingResponse(response);
            setShowPaymentInstructions(true);
        } catch (err: any) {
            setError(err.message || 'Failed to create booking');
        } finally {
            setIsLoading(false);
        }
    };

    // Set minimum date to tomorrow
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

    // If showing payment instructions, render that instead
    if (showPaymentInstructions && bookingResponse) {
        if (showReceiptUpload) {
            return (
                <PaymentReceiptUpload
                    bookingId={bookingResponse.booking.id}
                    onSuccess={() => {
                        setShowReceiptUpload(false);
                        onClose();
                        toast.showSuccess('Payment receipt uploaded successfully! The owner will verify it soon.');
                    }}
                    onCancel={() => setShowReceiptUpload(false)}
                />
            );
        }

        return (
            <PaymentInstructions
                amount={totalPrice}
                bankDetails={bookingResponse.ownerBankDetails}
                ownerContact={bookingResponse.ownerContact}
                bookingId={bookingResponse.booking.id}
                onUploadReceipt={() => setShowReceiptUpload(true)}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in border border-gray-100 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Book {hostel.name}</h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">{hostel.location}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all duration-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl animate-fade-in">
                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Check-in Date
                            </label>
                            <input
                                type="date"
                                id="checkIn"
                                value={checkIn}
                                onChange={(e) => setCheckIn(e.target.value)}
                                min={tomorrow}
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 outline-none"
                            />
                        </div>

                        <div>
                            <label htmlFor="checkOut" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Check-out Date
                            </label>
                            <input
                                type="date"
                                id="checkOut"
                                value={checkOut}
                                onChange={(e) => setCheckOut(e.target.value)}
                                min={checkIn || tomorrow}
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="guests" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Number of Guests
                        </label>
                        <input
                            type="number"
                            id="guests"
                            value={numberOfGuests}
                            onChange={(e) => setNumberOfGuests(parseInt(e.target.value))}
                            min={1}
                            max={10}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label htmlFor="requests" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Special Requests (Optional)
                        </label>
                        <textarea
                            id="requests"
                            value={specialRequests}
                            onChange={(e) => setSpecialRequests(e.target.value)}
                            rows={3}
                            maxLength={500}
                            placeholder="Any special requirements or requests..."
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{specialRequests.length}/500 characters</p>
                    </div>

                    {/* Price Summary */}
                    {duration > 0 && (
                        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4 animate-fade-in-up">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Booking Summary</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{duration} {duration === 1 ? 'day' : 'days'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Price per month:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">Rs {hostel.price.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Number of guests:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{numberOfGuests}</span>
                                </div>
                                <div className="border-t border-blue-300 dark:border-blue-600 pt-2 mt-2 flex justify-between">
                                    <span className="font-semibold text-gray-900 dark:text-white">Total Price:</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">Rs {totalPrice.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            fullWidth
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            fullWidth
                            disabled={isLoading || duration === 0}
                        >
                            {isLoading ? 'Creating Booking...' : 'Request Booking'}
                        </Button>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Your booking request will be sent to the owner for confirmation.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default BookingForm;
