import React, { useState } from 'react';
import { format, addMinutes } from 'date-fns';
import Button from './Button';

interface AppointmentSchedulerProps {
    hostelId: string;
    ownerId: string;
    hostelName: string;
    onClose: () => void;
    onSuccess?: () => void;
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
    hostelId,
    ownerId,
    hostelName,
    onClose,
    onSuccess
}) => {
    const [scheduledTime, setScheduledTime] = useState('');
    const [duration, setDuration] = useState(30);
    const [type, setType] = useState<'viewing' | 'consultation' | 'other'>('viewing');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!scheduledTime) {
            setError('Please select a date and time');
            return;
        }

        const appointmentDate = new Date(scheduledTime);
        if (appointmentDate < new Date()) {
            setError('Appointment must be in the future');
            return;
        }

        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5001/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    hostelId,
                    ownerId,
                    scheduledTime: appointmentDate.toISOString(),
                    duration,
                    type,
                    notes
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to schedule appointment');
            }

            onSuccess?.();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Get minimum datetime (1 hour from now)
    const minDateTime = format(addMinutes(new Date(), 60), "yyyy-MM-dd'T'HH:mm");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Schedule Appointment</h2>
                            <p className="text-gray-600 mt-1">{hostelName}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                            Appointment Type
                        </label>
                        <select
                            id="type"
                            value={type}
                            onChange={(e) => setType(e.target.value as any)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="viewing">Property Viewing</option>
                            <option value="consultation">Consultation</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="datetime" className="block text-sm font-medium text-gray-700 mb-2">
                            Date & Time
                        </label>
                        <input
                            type="datetime-local"
                            id="datetime"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            min={minDateTime}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                            Duration (minutes)
                        </label>
                        <select
                            id="duration"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={45}>45 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={90}>1.5 hours</option>
                            <option value={120}>2 hours</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                            Notes (Optional)
                        </label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            maxLength={500}
                            placeholder="Any specific questions or requirements..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">{notes.length}/500 characters</p>
                    </div>

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
                            disabled={isLoading}
                        >
                            {isLoading ? 'Scheduling...' : 'Schedule Appointment'}
                        </Button>
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                        The owner will receive your appointment request and confirm it.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default AppointmentScheduler;
