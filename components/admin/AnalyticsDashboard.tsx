import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
    period: { start: string; end: string };
    overview: {
        totalUsers: number;
        totalHostels: number;
        totalBookings: number;
        totalRevenue: number;
        verifiedUsers: number;
        pendingVerifications: number;
    };
    newThisPeriod: {
        users: number;
        hostels: number;
        bookings: number;
        revenue: number;
    };
    userBreakdown: { owners: number; customers: number; admins: number };
    hostelBreakdown: { total: number; verified: number; available: number };
    bookingBreakdown: { pending: number; confirmed: number; cancelled: number };
}

interface TrendData {
    _id: string;
    count: number;
    revenue?: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AnalyticsDashboard: React.FC = () => {
    const [overview, setOverview] = useState<AnalyticsData | null>(null);
    const [userTrends, setUserTrends] = useState<TrendData[]>([]);
    const [bookingTrends, setBookingTrends] = useState<TrendData[]>([]);
    const [revenueTrends, setRevenueTrends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState(30);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'bookings' | 'revenue'>('overview');

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    useEffect(() => {
        loadAnalytics();
    }, [dateRange]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [overviewRes, usersRes, bookingsRes, revenueRes] = await Promise.all([
                fetch(`${apiUrl}/api/admin/analytics/overview?days=${dateRange}`, { headers }),
                fetch(`${apiUrl}/api/admin/analytics/users?days=${dateRange}`, { headers }),
                fetch(`${apiUrl}/api/admin/analytics/bookings?days=${dateRange}`, { headers }),
                fetch(`${apiUrl}/api/admin/analytics/revenue?days=${dateRange}`, { headers })
            ]);

            if (overviewRes.ok) setOverview(await overviewRes.json());
            if (usersRes.ok) {
                const data = await usersRes.json();
                setUserTrends(data.trends || []);
            }
            if (bookingsRes.ok) {
                const data = await bookingsRes.json();
                setBookingTrends(data.trends || []);
            }
            if (revenueRes.ok) {
                const data = await revenueRes.json();
                setRevenueTrends(data.dailyTrends || []);
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return `Rs ${value.toLocaleString()}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Analytics Dashboard</h2>
                <div className="flex items-center gap-3">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(Number(e.target.value))}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                        <option value={365}>Last year</option>
                    </select>
                    <button
                        onClick={loadAnalytics}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                {(['overview', 'users', 'bookings', 'revenue'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-medium capitalize transition-colors ${activeTab === tab
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && overview && (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{overview.overview.totalUsers}</p>
                                </div>
                                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <span className="text-2xl">👥</span>
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-green-600">+{overview.newThisPeriod.users} this period</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Hostels</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{overview.overview.totalHostels}</p>
                                </div>
                                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                    <span className="text-2xl">🏠</span>
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-green-600">+{overview.newThisPeriod.hostels} this period</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Bookings</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{overview.overview.totalBookings}</p>
                                </div>
                                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                                    <span className="text-2xl">📅</span>
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-green-600">+{overview.newThisPeriod.bookings} this period</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(overview.overview.totalRevenue)}</p>
                                </div>
                                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                                    <span className="text-2xl">💰</span>
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-green-600">+{formatCurrency(overview.newThisPeriod.revenue)} this period</p>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* User Role Distribution */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Distribution</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Customers', value: overview.userBreakdown.customers },
                                            { name: 'Owners', value: overview.userBreakdown.owners },
                                            { name: 'Admins', value: overview.userBreakdown.admins }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {COLORS.map((color, index) => (
                                            <Cell key={`cell-${index}`} fill={color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Booking Status Distribution */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Booking Status</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={[
                                    { name: 'Pending', value: overview.bookingBreakdown.pending, fill: '#f59e0b' },
                                    { name: 'Confirmed', value: overview.bookingBreakdown.confirmed, fill: '#10b981' },
                                    { name: 'Cancelled', value: overview.bookingBreakdown.cancelled, fill: '#ef4444' }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Registration Trends</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={userTrends.map(t => ({ date: t._id, users: t.count }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Booking Trends</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={bookingTrends.map(t => ({ date: t._id, bookings: t.count, revenue: t.revenue }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="bookings" fill="#3b82f6" name="Bookings" />
                            <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Revenue" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Revenue Tab */}
            {activeTab === 'revenue' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trends</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueTrends.map(t => ({ date: t._id, revenue: t.revenue }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis tickFormatter={(value) => `Rs ${(value / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;
