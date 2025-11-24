import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import RiskScoreDisplay from './RiskScoreDisplay';

interface FraudReport {
    _id: string;
    reporterId: any;
    reportedUserId: any;
    hostelId: any;
    type: string;
    description: string;
    status: string;
    aiAnalysis: {
        totalRiskScore: number;
        riskLevel: string;
        flags: string[];
        imageScore: number;
        textScore: number;
        behaviorScore: number;
        priceScore: number;
    };
    createdAt: Date;
    resolvedBy?: any;
    resolvedAt?: Date;
    adminNotes?: string;
}

const AdminFraudDashboard: React.FC = () => {
    const [reports, setReports] = useState<FraudReport[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'investigating' | 'confirmed' | 'dismissed'>('all');
    const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<FraudReport | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        loadReports();
        loadStats();
    }, [filter, riskFilter]);

    const loadReports = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const params = new URLSearchParams();
            if (filter !== 'all') params.append('status', filter);
            if (riskFilter !== 'all') params.append('riskLevel', riskFilter);

            const res = await fetch(`http://localhost:5001/api/fraud/reports?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setReports(data.reports);
        } catch (error) {
            console.error('Failed to load reports:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('http://localhost:5001/api/fraud/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const updateReportStatus = async (reportId: string, status: string) => {
        setIsUpdating(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`http://localhost:5001/api/fraud/reports/${reportId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status, adminNotes })
            });

            if (res.ok) {
                await loadReports();
                await loadStats();
                setSelectedReport(null);
                setAdminNotes('');
            }
        } catch (error) {
            console.error('Failed to update report:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            fake_listing: 'Fake Listing',
            duplicate_images: 'Stolen Images',
            suspicious_text: 'Suspicious Content',
            scam: 'Scam/Fraud',
            impersonation: 'Impersonation',
            other: 'Other'
        };
        return labels[type] || type;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            investigating: 'bg-blue-100 text-blue-800',
            confirmed: 'bg-red-100 text-red-800',
            dismissed: 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="text-gray-500">Loading fraud reports...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Fraud Detection Dashboard</h1>
                <p className="text-gray-600 mt-2">Monitor and manage fraud reports</p>
            </div>

            {/* Statistics */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <p className="text-sm text-gray-600">Total Reports</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                    </div>
                    <div className="bg-yellow-50 p-6 rounded-xl shadow-sm border border-yellow-200">
                        <p className="text-sm text-yellow-800">Pending</p>
                        <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.byStatus.pending}</p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-200">
                        <p className="text-sm text-blue-800">Investigating</p>
                        <p className="text-3xl font-bold text-blue-900 mt-2">{stats.byStatus.investigating}</p>
                    </div>
                    <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-200">
                        <p className="text-sm text-red-800">Confirmed</p>
                        <p className="text-3xl font-bold text-red-900 mt-2">{stats.byStatus.confirmed}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="investigating">Investigating</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="dismissed">Dismissed</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
                        <select
                            value={riskFilter}
                            onChange={(e) => setRiskFilter(e.target.value as any)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Risk Levels</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Reports List */}
            <div className="space-y-4">
                {reports.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
                        <p className="text-gray-600">No fraud reports found</p>
                    </div>
                ) : (
                    reports.map((report) => (
                        <div
                            key={report._id}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
                                            {report.status.toUpperCase()}
                                        </span>
                                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                            {getTypeLabel(report.type)}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-1">
                                        Report #{report._id.slice(-6)}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Reported {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedReport(report)}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Review
                                </button>
                            </div>

                            <div className="mb-4">
                                <RiskScoreDisplay
                                    riskScore={report.aiAnalysis.totalRiskScore}
                                    riskLevel={report.aiAnalysis.riskLevel as any}
                                    flags={report.aiAnalysis.flags}
                                    showDetails={false}
                                />
                            </div>

                            <p className="text-sm text-gray-700 line-clamp-2">{report.description}</p>
                        </div>
                    ))
                )}
            </div>

            {/* Report Detail Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-gray-900">Fraud Report Details</h2>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* AI Analysis */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">AI Risk Analysis</h3>
                                <RiskScoreDisplay
                                    riskScore={selectedReport.aiAnalysis.totalRiskScore}
                                    riskLevel={selectedReport.aiAnalysis.riskLevel as any}
                                    flags={selectedReport.aiAnalysis.flags}
                                    showDetails={true}
                                />
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-600">Image Score</p>
                                        <p className="text-lg font-semibold text-gray-900">{selectedReport.aiAnalysis.imageScore}/30</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-600">Text Score</p>
                                        <p className="text-lg font-semibold text-gray-900">{selectedReport.aiAnalysis.textScore}/25</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-600">Behavior Score</p>
                                        <p className="text-lg font-semibold text-gray-900">{selectedReport.aiAnalysis.behaviorScore}/20</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-600">Price Score</p>
                                        <p className="text-lg font-semibold text-gray-900">{selectedReport.aiAnalysis.priceScore}/15</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedReport.description}</p>
                            </div>

                            {/* Admin Notes */}
                            <div>
                                <label className="block font-semibold text-gray-900 mb-2">Admin Notes</label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Add notes about your decision..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => updateReportStatus(selectedReport._id, 'investigating')}
                                    disabled={isUpdating}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Mark Investigating
                                </button>
                                <button
                                    onClick={() => updateReportStatus(selectedReport._id, 'confirmed')}
                                    disabled={isUpdating}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    Confirm Fraud
                                </button>
                                <button
                                    onClick={() => updateReportStatus(selectedReport._id, 'dismissed')}
                                    disabled={isUpdating}
                                    className="flex-1 px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFraudDashboard;
