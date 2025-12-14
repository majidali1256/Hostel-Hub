import React, { useState, useEffect } from 'react';
import { Users, Building2, DollarSign, AlertTriangle, ArrowRight, Server, Database, Clock, Code } from 'lucide-react';

interface AdminDashboardProps {
    onNavigate: (page: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5001/api/admin/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading dashboard...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Users</h3>
                        <span className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Users className="w-5 h-5 lg:w-6 lg:h-6" />
                        </span>
                    </div>
                    <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{stats?.users || 0}</p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center">
                        <span className="mr-1">↑</span> 12% from last month
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Hostels</h3>
                        <span className="p-2 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-lg">
                            <Building2 className="w-5 h-5 lg:w-6 lg:h-6" />
                        </span>
                    </div>
                    <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{stats?.hostels || 0}</p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center">
                        <span className="mr-1">↑</span> 5% from last month
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Revenue</h3>
                        <span className="p-2 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg">
                            <DollarSign className="w-5 h-5 lg:w-6 lg:h-6" />
                        </span>
                    </div>
                    <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">${(stats?.totalRevenue || 0).toLocaleString()}</p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center">
                        <span className="mr-1">↑</span> 8% from last month
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Pending Reports</h3>
                        <span className="p-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg">
                            <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6" />
                        </span>
                    </div>
                    <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{stats?.pendingReports || 0}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Action required</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => onNavigate('users')}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <span className="font-medium text-gray-700 dark:text-gray-200">Manage Users</span>
                            <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </button>
                        <button
                            onClick={() => onNavigate('moderation')}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <span className="font-medium text-gray-700 dark:text-gray-200">Review Reports</span>
                            <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </button>
                        <button
                            onClick={() => onNavigate('settings')}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <span className="font-medium text-gray-700 dark:text-gray-200">System Settings</span>
                            <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">System Health</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <Server className="w-4 h-4" />
                                <span>Server Status</span>
                            </div>
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">Operational</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <Database className="w-4 h-4" />
                                <span>Database</span>
                            </div>
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">Connected</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <Clock className="w-4 h-4" />
                                <span>Last Backup</span>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">2 hours ago</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <Code className="w-4 h-4" />
                                <span>Version</span>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">v1.2.0</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
