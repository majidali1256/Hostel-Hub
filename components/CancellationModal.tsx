import React, { useState } from 'react';
import Button from './Button';

interface CancellationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    isLoading: boolean;
    isOwner?: boolean;
}

const CancellationModal: React.FC<CancellationModalProps> = ({ isOpen, onClose, onConfirm, isLoading, isOwner }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            setError('Please provide a reason for cancellation.');
            return;
        }
        onConfirm(reason);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-in border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                    Cancel Booking
                </h2>

                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Are you sure you want to cancel this booking? This action cannot be undone.
                    {isOwner && " The customer will be notified immediately."}
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Reason for Cancellation <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                            rows={3}
                            placeholder={isOwner ? "e.g., Maintenance required, Double booking..." : "e.g., Change of plans, Found another place..."}
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                setError('');
                            }}
                        />
                        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 transition-all duration-200 active:scale-95"
                            disabled={isLoading}
                        >
                            Keep Booking
                        </button>
                        <Button
                            type="submit"
                            variant="danger"
                            isLoading={isLoading}
                        >
                            Confirm Cancellation
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CancellationModal;
