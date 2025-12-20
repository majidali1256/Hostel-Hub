import React, { useState, useEffect } from 'react';
import { api } from '../services/mongoService';
import Button from './Button';

interface Appointment {
    _id: string;
    hostelId: { _id: string; name: string };
    customerId: { _id: string; username: string; firstName?: string; lastName?: string };
    ownerId: { _id: string; username: string };
    scheduledTime: string;
    duration: number;
    type: 'viewing' | 'consultation' | 'other';
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    notes?: string;
    createdAt: string;
}

interface AppointmentDashboardProps {
    userRole: 'owner' | 'customer';
    userId: string;
}

const AppointmentDashboard: React.FC<AppointmentDashboardProps> = ({ userRole, userId }) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const endpoint = userRole === 'owner'
                ? 'http://localhost:5001/api/appointments?role=owner'
                : 'http://localhost:5001/api/appointments';

            const res = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setAppointments(data);
            }
        } catch (error) {
            console.error('Failed to load appointments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async (appointmentId: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5001/api/appointments/${appointmentId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'confirmed' })
            });

            if (res.ok) {
                alert('Appointment confirmed! Customer will be notified.');
                loadAppointments();
            }
        } catch (error) {
            alert('Failed to confirm appointment');
        }
    };

    const handleCancel = async (appointmentId: string) => {
        const reason = prompt('Reason for cancellation (optional):');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5001/api/appointments/${appointmentId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'cancelled', cancelReason: reason })
            });

            if (res.ok) {
                alert('Appointment cancelled');
                loadAppointments();
            }
        } catch (error) {
            alert('Failed to cancel appointment');
        }
    };

    const filteredAppointments = appointments.filter(apt => {
        if (filter === 'all') return true;
        return apt.status === filter;
    });

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-700',
            confirmed: 'bg-green-100 text-green-700',
            cancelled: 'bg-red-100 text-red-700',
            completed: 'bg-blue-100 text-blue-700'
        };
        return badges[status as keyof typeof badges] || badges.pending;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading appointments...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                {userRole === 'owner' ? 'Appointment Requests' : 'My Appointments'}
            </h1>

            {/* Filter Buttons */}
            <div className="mb-6 flex gap-2">
                {['all', 'pending', 'confirmed', 'completed'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status as any)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === status
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-white'
                            }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {/* Appointments List */}
            {filteredAppointments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">No appointments found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredAppointments.map(appointment => (
                        <div
                            key={appointment._id}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {appointment.hostelId.name}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {userRole === 'owner'
                                            ? `Requested by: ${appointment.customerId.firstName || appointment.customerId.username}`
                                            : `Type: ${appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1)}`
                                        }
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(appointment.status)}`}>
                                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">📅 Scheduled Time</p>
                                    <p className="text-gray-900 dark:text-white">{formatDate(appointment.scheduledTime)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">⏱️ Duration</p>
                                    <p className="text-gray-900 dark:text-white">{appointment.duration} minutes</p>
                                </div>
                            </div>

                            {appointment.notes && (
                                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes:</p>
                                    <p className="text-gray-900 dark:text-white">{appointment.notes}</p>
                                </div>
                            )}

                            {/* Actions */}
                            {userRole === 'owner' && appointment.status === 'pending' && (
                                <div className="flex gap-2 mt-4">
                                    <Button onClick={() => handleConfirm(appointment._id)}>
                                        ✓ Confirm
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleCancel(appointment._id)}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        ✗ Decline
                                    </Button>
                                </div>
                            )}

                            {userRole === 'customer' && appointment.status === 'pending' && (
                                <div className="mt-4">
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleCancel(appointment._id)}
                                    >
                                        Cancel Request
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AppointmentDashboard;
