import React, { useState, useEffect } from 'react';
import { Search, UserX, UserCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useToast } from '../../contexts/ToastContext';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const { confirm } = useConfirm();
    const { toast } = useToast();

    useEffect(() => {
        loadUsers();
    }, [search, filter]);

    const loadUsers = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const token = localStorage.getItem('token');

            if (!token) {
                setError('No authentication token found. Please log in again.');
                return;
            }

            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filter !== 'all') params.append('status', filter);

            const res = await fetch(`http://localhost:5001/api/admin/users?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                if (res.status === 401) {
                    setError('Session expired. Please log in again.');
                } else if (res.status === 403) {
                    setError('Access denied. Admin privileges required.');
                } else {
                    setError('Failed to load users. Please try again.');
                }
                return;
            }

            const data = await res.json();
            setUsers(data.users || []);
        } catch (error) {
            console.error('Failed to load users:', error);
            setError('Failed to connect to server. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (userId: string, action: string) => {
        if (await confirm({
            title: `${action === 'ban' ? 'Ban' : 'Unban'} User`,
            message: `Are you sure you want to ${action} this user?`,
            type: action === 'ban' ? 'danger' : 'warning',
            confirmText: action === 'ban' ? 'Ban User' : 'Unban User'
        })) {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    toast.showError('Authentication token missing');
                    return;
                }

                await fetch(`http://localhost:5001/api/admin/users/${userId}/action`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ action, reason: 'Admin action' })
                });
                loadUsers();
                toast.showSuccess(`User ${action}ned successfully`);
            } catch (error) {
                console.error('Failed to perform action:', error);
                toast.showError('Failed to update user status');
            }
        }
    };

    if (error) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">Failed to Load Users</h3>
                <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                <button
                    onClick={loadUsers}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-4 sm:px-6 py-4">User</th>
                            <th className="px-4 sm:px-6 py-4 hidden sm:table-cell">Role</th>
                            <th className="px-4 sm:px-6 py-4">Status</th>
                            <th className="px-4 sm:px-6 py-4 hidden md:table-cell">Joined</th>
                            <th className="px-4 sm:px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">No users found</td></tr>
                        ) : (
                            users.map(user => (
                                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 sm:px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-sm">
                                                {user.firstName?.[0] || 'U'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-white truncate">{user.firstName} {user.lastName}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 capitalize text-gray-600 dark:text-gray-300 hidden sm:table-cell">{user.role}</td>
                                    <td className="px-4 sm:px-6 py-4">
                                        {user.isBanned ? (
                                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 text-xs font-medium rounded-full">Banned</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">Active</span>
                                        )}
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-gray-500 dark:text-gray-400 text-sm hidden md:table-cell">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-right">
                                        {user.isBanned ? (
                                            <button
                                                onClick={() => handleAction(user._id, 'unban')}
                                                className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm font-medium"
                                            >
                                                <UserCheck className="w-4 h-4" />
                                                <span className="hidden sm:inline">Unban</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleAction(user._id, 'ban')}
                                                className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
                                            >
                                                <UserX className="w-4 h-4" />
                                                <span className="hidden sm:inline">Ban</span>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
