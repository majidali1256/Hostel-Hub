import React, { useState } from 'react';

type ReportType = 'users' | 'bookings' | 'hostels' | 'revenue' | 'summary';

interface ReportData {
    type: string;
    period: { start: string; end: string };
    totalCount?: number;
    totalRevenue?: number;
    data?: any[];
    users?: { total: number; new: number; verified: number };
    hostels?: { total: number; new: number; verified: number };
    bookings?: { total: number; confirmed: number; pending: number };
    generatedAt: string;
}

const ReportsGenerator: React.FC = () => {
    const [reportType, setReportType] = useState<ReportType>('summary');
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    const generateReport = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');

            const res = await fetch(
                `${apiUrl}/api/admin/reports/generate/${reportType}?startDate=${startDate}&endDate=${endDate}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (res.ok) {
                const data = await res.json();
                setReport(data);
            } else {
                const err = await res.json();
                setError(err.error || 'Failed to generate report');
            }
        } catch (err) {
            setError('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const exportCSV = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(
                `${apiUrl}/api/admin/reports/export/${reportType}?startDate=${startDate}&endDate=${endDate}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${reportType}_report_${startDate}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            setError('Failed to export report');
        }
    };

    const formatCurrency = (value: number) => `Rs ${value.toLocaleString()}`;
    const formatDate = (date: string) => new Date(date).toLocaleDateString();

    const reportTypes: { value: ReportType; label: string; icon: string }[] = [
        { value: 'summary', label: 'Summary', icon: '📊' },
        { value: 'users', label: 'Users', icon: '👥' },
        { value: 'bookings', label: 'Bookings', icon: '📅' },
        { value: 'hostels', label: 'Hostels', icon: '🏠' },
        { value: 'revenue', label: 'Revenue', icon: '💰' }
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📋 Reports Generator</h2>

            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Report Type
                        </label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value as ReportType)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            {reportTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.icon} {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <div className="flex items-end gap-2">
                        <button
                            onClick={generateReport}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Generating...' : 'Generate'}
                        </button>
                        {report && reportType !== 'summary' && (
                            <button
                                onClick={exportCSV}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                📄 CSV
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded-lg">{error}</div>
            )}

            {/* Report Display */}
            {report && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{report.type}</h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Generated: {formatDate(report.generatedAt)}
                        </span>
                    </div>

                    <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                        Period: {formatDate(report.period.start)} - {formatDate(report.period.end)}
                    </div>

                    {/* Summary Report */}
                    {reportType === 'summary' && report.users && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">👥 Users</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Total:</span>
                                        <span className="font-bold">{report.users.total}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>New:</span>
                                        <span className="font-bold text-green-600">+{report.users.new}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Verified:</span>
                                        <span className="font-bold">{report.users.verified}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-3">🏠 Hostels</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Total:</span>
                                        <span className="font-bold">{report.hostels?.total}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>New:</span>
                                        <span className="font-bold text-green-600">+{report.hostels?.new}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Verified:</span>
                                        <span className="font-bold">{report.hostels?.verified}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3">📅 Bookings</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Total:</span>
                                        <span className="font-bold">{report.bookings?.total}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Confirmed:</span>
                                        <span className="font-bold text-green-600">{report.bookings?.confirmed}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Pending:</span>
                                        <span className="font-bold text-yellow-600">{report.bookings?.pending}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Other Reports - Data Table */}
                    {reportType !== 'summary' && report.data && (
                        <div>
                            {report.totalRevenue !== undefined && (
                                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <span className="text-lg font-bold text-green-800 dark:text-green-300">
                                        Total Revenue: {formatCurrency(report.totalRevenue)}
                                    </span>
                                </div>
                            )}

                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Total Records: {report.totalCount || report.data.length}
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            {reportType === 'users' && (
                                                <>
                                                    <th className="p-3 text-left">Username</th>
                                                    <th className="p-3 text-left">Email</th>
                                                    <th className="p-3 text-left">Role</th>
                                                    <th className="p-3 text-left">Status</th>
                                                    <th className="p-3 text-left">Created</th>
                                                </>
                                            )}
                                            {reportType === 'bookings' && (
                                                <>
                                                    <th className="p-3 text-left">Hostel</th>
                                                    <th className="p-3 text-left">Customer</th>
                                                    <th className="p-3 text-left">Status</th>
                                                    <th className="p-3 text-left">Price</th>
                                                    <th className="p-3 text-left">Created</th>
                                                </>
                                            )}
                                            {reportType === 'hostels' && (
                                                <>
                                                    <th className="p-3 text-left">Name</th>
                                                    <th className="p-3 text-left">Location</th>
                                                    <th className="p-3 text-left">Category</th>
                                                    <th className="p-3 text-left">Price</th>
                                                    <th className="p-3 text-left">Verified</th>
                                                </>
                                            )}
                                            {reportType === 'revenue' && (
                                                <>
                                                    <th className="p-3 text-left">Hostel</th>
                                                    <th className="p-3 text-left">Amount</th>
                                                    <th className="p-3 text-left">Date</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {report.data.slice(0, 20).map((item, i) => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                {reportType === 'users' && (
                                                    <>
                                                        <td className="p-3">{item.username}</td>
                                                        <td className="p-3">{item.email}</td>
                                                        <td className="p-3">{item.role}</td>
                                                        <td className="p-3">{item.verificationStatus}</td>
                                                        <td className="p-3">{formatDate(item.createdAt)}</td>
                                                    </>
                                                )}
                                                {reportType === 'bookings' && (
                                                    <>
                                                        <td className="p-3">{item.hostelId?.name || '-'}</td>
                                                        <td className="p-3">{item.customerId?.username || '-'}</td>
                                                        <td className="p-3">{item.status}</td>
                                                        <td className="p-3">{formatCurrency(item.totalPrice || 0)}</td>
                                                        <td className="p-3">{formatDate(item.createdAt)}</td>
                                                    </>
                                                )}
                                                {reportType === 'hostels' && (
                                                    <>
                                                        <td className="p-3">{item.name}</td>
                                                        <td className="p-3">{item.location}</td>
                                                        <td className="p-3">{item.category}</td>
                                                        <td className="p-3">{formatCurrency(item.price)}</td>
                                                        <td className="p-3">{item.verified ? '✅' : '❌'}</td>
                                                    </>
                                                )}
                                                {reportType === 'revenue' && (
                                                    <>
                                                        <td className="p-3">{item.hostelId?.name || '-'}</td>
                                                        <td className="p-3">{formatCurrency(item.totalPrice || 0)}</td>
                                                        <td className="p-3">{formatDate(item.createdAt)}</td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {report.data.length > 20 && (
                                    <p className="mt-2 text-sm text-gray-500">
                                        Showing 20 of {report.data.length} records. Export to CSV for full data.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReportsGenerator;
