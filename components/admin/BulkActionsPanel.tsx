import React, { useState, useEffect } from 'react';

interface User {
    id: string;
    _id: string;
    username: string;
    email: string;
    role: string;
    verificationStatus: string;
    status?: string;
}

interface Hostel {
    id: string;
    _id: string;
    name: string;
    location: string;
    verified: boolean;
    status: string;
}

type EntityType = 'users' | 'hostels';

const BulkActionsPanel: React.FC = () => {
    const [entityType, setEntityType] = useState<EntityType>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [hostels, setHostels] = useState<Hostel[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    useEffect(() => {
        loadData();
    }, [entityType]);

    const loadData = async () => {
        try {
            setLoading(true);
            setSelectedIds(new Set());
            const token = localStorage.getItem('token');

            if (entityType === 'users') {
                const res = await fetch(`${apiUrl}/api/admin/users`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.users || []);
                }
            } else {
                const res = await fetch(`${apiUrl}/api/hostels`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setHostels(data || []);
                }
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const selectAll = () => {
        if (entityType === 'users') {
            setSelectedIds(new Set(users.map(u => u._id || u.id)));
        } else {
            setSelectedIds(new Set(hostels.map(h => h._id || h.id)));
        }
    };

    const deselectAll = () => {
        setSelectedIds(new Set());
    };

    const executeBulkAction = async (action: string) => {
        if (selectedIds.size === 0) {
            setMessage({ type: 'error', text: 'No items selected' });
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to ${action} ${selectedIds.size} ${entityType}?`
        );
        if (!confirmed) return;

        try {
            setActionLoading(true);
            const token = localStorage.getItem('token');
            const endpoint = entityType === 'users'
                ? `${apiUrl}/api/admin/bulk/users`
                : `${apiUrl}/api/admin/bulk/hostels`;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    [entityType === 'users' ? 'userIds' : 'hostelIds']: Array.from(selectedIds),
                    action
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: `Successfully ${action}ed ${data.affectedCount} ${entityType}` });
                setSelectedIds(new Set());
                loadData();
            } else {
                setMessage({ type: 'error', text: data.error || 'Action failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to execute action' });
        } finally {
            setActionLoading(false);
        }
    };

    const getUserActions = () => ['verify', 'suspend', 'activate', 'delete'];
    const getHostelActions = () => ['verify', 'unverify', 'activate', 'deactivate', 'delete'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">⚡ Bulk Actions</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setEntityType('users')}
                        className={`px-4 py-2 rounded-lg font-medium ${entityType === 'users'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        👥 Users
                    </button>
                    <button
                        onClick={() => setEntityType('hostels')}
                        className={`px-4 py-2 rounded-lg font-medium ${entityType === 'hostels'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        🏠 Hostels
                    </button>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                    }`}>
                    {message.text}
                    <button onClick={() => setMessage(null)} className="ml-4 font-bold">×</button>
                </div>
            )}

            {/* Actions Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedIds.size} selected
                    </span>
                    <button onClick={selectAll} className="text-sm text-blue-600 hover:underline">
                        Select All
                    </button>
                    <button onClick={deselectAll} className="text-sm text-gray-600 hover:underline">
                        Deselect All
                    </button>
                    <div className="flex-1" />
                    {(entityType === 'users' ? getUserActions() : getHostelActions()).map(action => (
                        <button
                            key={action}
                            onClick={() => executeBulkAction(action)}
                            disabled={selectedIds.size === 0 || actionLoading}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize disabled:opacity-50 ${action === 'delete'
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : action === 'suspend' || action === 'deactivate' || action === 'unverify'
                                    ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                        >
                            {actionLoading ? 'Processing...' : action}
                        </button>
                    ))}
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
                ) : entityType === 'users' ? (
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="p-4 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === users.length && users.length > 0}
                                        onChange={() => selectedIds.size === users.length ? deselectAll() : selectAll()}
                                        className="w-4 h-4"
                                    />
                                </th>
                                <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Username</th>
                                <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Email</th>
                                <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Role</th>
                                <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {users.map(user => (
                                <tr key={user._id || user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="p-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(user._id || user.id)}
                                            onChange={() => toggleSelect(user._id || user.id)}
                                            className="w-4 h-4"
                                        />
                                    </td>
                                    <td className="p-4 text-gray-900 dark:text-white">{user.username}</td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300' :
                                            user.role === 'owner' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300' :
                                                'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${user.verificationStatus === 'verified' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
                                            user.verificationStatus === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' :
                                                'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                            }`}>
                                            {user.verificationStatus}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="p-4 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === hostels.length && hostels.length > 0}
                                        onChange={() => selectedIds.size === hostels.length ? deselectAll() : selectAll()}
                                        className="w-4 h-4"
                                    />
                                </th>
                                <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Name</th>
                                <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Location</th>
                                <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Verified</th>
                                <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {hostels.map(hostel => (
                                <tr key={hostel._id || hostel.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="p-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(hostel._id || hostel.id)}
                                            onChange={() => toggleSelect(hostel._id || hostel.id)}
                                            className="w-4 h-4"
                                        />
                                    </td>
                                    <td className="p-4 text-gray-900 dark:text-white">{hostel.name}</td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400">{hostel.location}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${hostel.verified ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                            }`}>
                                            {hostel.verified ? 'Verified' : 'Unverified'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${hostel.status === 'Available' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                            }`}>
                                            {hostel.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default BulkActionsPanel;
