import React, { useState, useEffect } from 'react';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadUsers();
    }, [search, filter]);

    const loadUsers = async () => {
        try {
            const token = localStorage.getItem('hh_access_token');
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filter !== 'all') params.append('status', filter);

            const res = await fetch(`http://localhost:5001/api/admin/users?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setUsers(data.users || []);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (userId: string, action: string) => {
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        try {
            const token = localStorage.getItem('hh_access_token');
            await fetch(`http://localhost:5001/api/admin/users/${userId}/action`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action, reason: 'Admin action' })
            });
            loadUsers();
        } catch (error) {
            console.error('Failed to perform action:', error);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 flex gap-4">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-8 text-center">Loading...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No users found</td></tr>
                        ) : (
                            users.map(user => (
                                <tr key={user._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                                {user.firstName[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 capitalize text-gray-600">{user.role}</td>
                                    <td className="px-6 py-4">
                                        {user.isBanned ? (
                                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Banned</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Active</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {user.isBanned ? (
                                            <button
                                                onClick={() => handleAction(user._id, 'unban')}
                                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                                            >
                                                Unban
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleAction(user._id, 'ban')}
                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                            >
                                                Ban
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
