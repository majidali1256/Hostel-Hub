import React, { useState, useEffect } from 'react';

interface NotificationPreferences {
    email: {
        bookings: boolean;
        messages: boolean;
        reviews: boolean;
        appointments: boolean;
        payments: boolean;
        marketing: boolean;
        system: boolean;
    };
    push: {
        bookings: boolean;
        messages: boolean;
        reviews: boolean;
        appointments: boolean;
        payments: boolean;
        system: boolean;
    };
    inApp: {
        bookings: boolean;
        messages: boolean;
        reviews: boolean;
        appointments: boolean;
        payments: boolean;
        system: boolean;
    };
}

const NotificationPreferencesPage: React.FC = () => {
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5001/api/notifications/preferences', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            setPreferences(data);
        } catch (error) {
            console.error('Failed to load preferences:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const savePreferences = async () => {
        if (!preferences) return;

        setIsSaving(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5001/api/notifications/preferences', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(preferences)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Preferences saved successfully!' });
            } else {
                throw new Error('Failed to save preferences');
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    const togglePreference = (channel: 'email' | 'push' | 'inApp', type: string) => {
        if (!preferences) return;

        setPreferences({
            ...preferences,
            [channel]: {
                ...preferences[channel],
                [type]: !preferences[channel][type as keyof typeof preferences.email]
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="text-gray-500">Loading preferences...</div>
            </div>
        );
    }

    if (!preferences) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">Failed to load preferences</p>
            </div>
        );
    }

    const notificationTypes = [
        { key: 'bookings', label: 'Bookings', description: 'Booking confirmations, cancellations, and reminders' },
        { key: 'messages', label: 'Messages', description: 'New messages and conversation updates' },
        { key: 'reviews', label: 'Reviews', description: 'New reviews and responses' },
        { key: 'appointments', label: 'Appointments', description: 'Appointment requests, confirmations, and reminders' },
        { key: 'payments', label: 'Payments', description: 'Payment confirmations and receipts' },
        { key: 'marketing', label: 'Marketing', description: 'Promotional offers and updates (email only)', emailOnly: true },
        { key: 'system', label: 'System', description: 'Account updates and important announcements' }
    ];

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Notification Preferences</h1>
                <p className="text-gray-600 mt-2">Manage how you receive notifications</p>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                    <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {message.text}
                    </p>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Notification Type</th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Email</th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Push</th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">In-App</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {notificationTypes.map((type) => (
                                <tr key={type.key} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-gray-900">{type.label}</p>
                                            <p className="text-sm text-gray-600">{type.description}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={preferences.email[type.key as keyof typeof preferences.email]}
                                                onChange={() => togglePreference('email', type.key)}
                                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                        </label>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {!type.emailOnly && (
                                            <label className="inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={preferences.push[type.key as keyof typeof preferences.push]}
                                                    onChange={() => togglePreference('push', type.key)}
                                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                            </label>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {!type.emailOnly && (
                                            <label className="inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={preferences.inApp[type.key as keyof typeof preferences.inApp]}
                                                    onChange={() => togglePreference('inApp', type.key)}
                                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                            </label>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={savePreferences}
                    disabled={isSaving}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                </button>
            </div>
        </div>
    );
};

export default NotificationPreferencesPage;
