import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface FraudStats {
    totalReports: number;
    pendingReports: number;
    resolvedReports: number;
    highRiskListings: number;
    recentReports: FraudReport[];
}

interface FraudReport {
    _id: string;
    reportType: string;
    targetId: any;
    reportedBy: { firstName: string; lastName: string };
    reason: string;
    description: string;
    status: string;
    aiAnalysis?: {
        suspicionScore: number;
        redFlags: string[];
        reasoning: string;
    };
    createdAt: string;
}

const FraudDashboard: React.FC = () => {
    const [stats, setStats] = useState<FraudStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<FraudReport | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${apiUrl}/api/fraud/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (error) {
            console.error('Error loading fraud stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolveReport = async (reportId: string, resolution: string, action: string) => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${apiUrl}/api/fraud/reports/${reportId}`, {
                status: 'resolved',
                resolution,
                actionTaken: action
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Report resolved successfully');
            setSelectedReport(null);
            loadStats();
        } catch (error) {
            console.error('Error resolving report:', error);
            alert('Failed to resolve report');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDismissReport = async (reportId: string) => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${apiUrl}/api/fraud/reports/${reportId}`, {
                status: 'dismissed',
                resolution: 'No action required',
                actionTaken: 'none'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Report dismissed');
            setSelectedReport(null);
            loadStats();
        } catch (error) {
            console.error('Error dismissing report:', error);
            alert('Failed to dismiss report');
        } finally {
            setActionLoading(false);
        }
    };

    const getRiskColor = (score: number) => {
        if (score >= 80) return 'text-red-600 bg-red-100';
        if (score >= 60) return 'text-orange-600 bg-orange-100';
        if (score >= 30) return 'text-yellow-600 bg-yellow-100';
        return 'text-green-600 bg-green-100';
    };

    const getRiskLabel = (score: number) => {
        if (score >= 80) return 'Critical';
        if (score >= 60) return 'High';
        if (score >= 30) return 'Medium';
        return 'Low';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading fraud detection dashboard...</div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-red-500">Failed to load fraud statistics</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                    🛡️ Fraud Detection Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Monitor and manage fraud reports across the platform
                </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Reports</p>
                            <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                                {stats.totalReports}
                            </p>
                        </div>
                        <div className="text-4xl">📊</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
                            <p className="text-3xl font-bold text-orange-600 mt-2">
                                {stats.pendingReports}
                            </p>
                        </div>
                        <div className="text-4xl">⏳</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
                            <p className="text-3xl font-bold text-green-600 mt-2">
                                {stats.resolvedReports}
                            </p>
                        </div>
                        <div className="text-4xl">✅</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">High Risk</p>
                            <p className="text-3xl font-bold text-red-600 mt-2">
                                {stats.highRiskListings}
                            </p>
                        </div>
                        <div className="text-4xl">🚨</div>
                    </div>
                </div>
            </div>

            {/* Recent Reports */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        Recent Fraud Reports
                    </h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {stats.recentReports && stats.recentReports.length > 0 ? (
                        stats.recentReports.map((report) => (
                            <div
                                key={report._id}
                                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition"
                                onClick={() => setSelectedReport(report)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                                {report.reportType}
                                            </span>
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {report.status}
                                            </span>
                                            {report.aiAnalysis && (
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getRiskColor(report.aiAnalysis.suspicionScore)
                                                    }`}>
                                                    {getRiskLabel(report.aiAnalysis.suspicionScore)} Risk ({report.aiAnalysis.suspicionScore})
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                                            {report.reason.replace(/_/g, ' ').toUpperCase()}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            {report.description}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Reported by: {report.reportedBy?.firstName} {report.reportedBy?.lastName} • {new Date(report.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                                        Review →
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-gray-500">
                            No fraud reports yet
                        </div>
                    )}
                </div>
            </div>

            {/* Report Details Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                    Fraud Report Details
                                </h2>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Type</label>
                                <p className="text-gray-800 dark:text-white capitalize">{selectedReport.reportType}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Reason</label>
                                <p className="text-gray-800 dark:text-white">{selectedReport.reason.replace(/_/g, ' ')}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Description</label>
                                <p className="text-gray-800 dark:text-white">{selectedReport.description}</p>
                            </div>

                            {selectedReport.aiAnalysis && (
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">AI Analysis</h3>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Risk Score: </span>
                                            <span className={`font-bold ${getRiskColor(selectedReport.aiAnalysis.suspicionScore)}`}>
                                                {selectedReport.aiAnalysis.suspicionScore}/100 ({getRiskLabel(selectedReport.aiAnalysis.suspicionScore)})
                                            </span>
                                        </div>
                                        {selectedReport.aiAnalysis.redFlags && selectedReport.aiAnalysis.redFlags.length > 0 && (
                                            <div>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Red Flags:</span>
                                                <ul className="list-disc list-inside mt-1">
                                                    {selectedReport.aiAnalysis.redFlags.map((flag, i) => (
                                                        <li key={i} className="text-sm text-gray-700 dark:text-gray-300">{flag}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {selectedReport.aiAnalysis.reasoning && (
                                            <div>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Reasoning: </span>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedReport.aiAnalysis.reasoning}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedReport.status === 'pending' && (
                            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                                <button
                                    onClick={() => handleResolveReport(selectedReport._id, 'Content removed', 'content_removed')}
                                    disabled={actionLoading}
                                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    Remove Content
                                </button>
                                <button
                                    onClick={() => handleResolveReport(selectedReport._id, 'Warning issued', 'warning')}
                                    disabled={actionLoading}
                                    className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                                >
                                    Issue Warning
                                </button>
                                <button
                                    onClick={() => handleDismissReport(selectedReport._id)}
                                    disabled={actionLoading}
                                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FraudDashboard;
