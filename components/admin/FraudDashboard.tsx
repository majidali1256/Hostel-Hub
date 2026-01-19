import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useToast } from '../../contexts/ToastContext';
import Button from '../Button';

interface Flag {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    evidence?: any;
}

interface FraudCheck {
    _id: string;
    hostelId: {
        _id: string;
        name: string;
        description: string;
        price: number;
        images: string[];
    };
    ownerId: {
        _id: string;
        username: string;
        email: string;
    };
    riskScore: number;
    flags: Flag[];
    aiAnalysis?: string;
    status: 'pending' | 'reviewed' | 'approved' | 'rejected';
    createdAt: string;
    reviewedBy?: { username: string };
    reviewedAt?: string;
    reviewNotes?: string;
}

const FraudDashboard: React.FC = () => {
    const [fraudChecks, setFraudChecks] = useState<FraudCheck[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [riskFilter, setRiskFilter] = useState('all');
    const [selectedCheck, setSelectedCheck] = useState<FraudCheck | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const toast = useToast();

    useEffect(() => {
        loadFraudQueue();
        loadStats();
    }, [statusFilter, riskFilter]);

    const loadFraudQueue = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(
                `http://localhost:5001/api/admin/fraud/queue?status=${statusFilter}&riskLevel=${riskFilter}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (res.ok) {
                const data = await res.json();
                setFraudChecks(data);
            }
        } catch (error) {
            console.error('Failed to load fraud queue:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5001/api/admin/fraud/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const handleReview = async (checkId: string, decision: 'approve' | 'reject') => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5001/api/admin/fraud/review/${checkId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ decision, notes: reviewNotes })
            });

            if (res.ok) {
                toast.showSuccess(`Listing ${decision === 'approve' ? 'approved' : 'rejected'} successfully`);
                setSelectedCheck(null);
                setReviewNotes('');
                loadFraudQueue();
                loadStats();
            }
        } catch (error) {
            toast.showError('Failed to review listing');
        }
    };

    const getRiskColor = (score: number) => {
        if (score >= 70) return 'text-red-600 dark:text-red-400';
        if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-green-600 dark:text-green-400';
    };

    const getRiskBadge = (score: number) => {
        if (score >= 70) return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200';
        if (score >= 40) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200';
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200';
    };

    const getSeverityBadge = (severity: string) => {
        const badges = {
            high: 'bg-red-100 text-red-700',
            medium: 'bg-yellow-100 text-yellow-700',
            low: 'bg-blue-100 text-blue-700'
        };
        return badges[severity as keyof typeof badges] || badges.low;
    };

    if (isLoading && !stats) {
        return <div className="p-8 text-center">Loading fraud detection data...</div>;
    }

    const pieData = stats ? [
        { name: 'High Risk', value: stats.riskLevels.high, color: '#ef4444' },
        { name: 'Medium Risk', value: stats.riskLevels.medium, color: '#eab308' },
        { name: 'Low Risk', value: stats.riskLevels.low, color: '#22c55e' }
    ] : [];

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                🚨 Fraud Detection Dashboard
            </h1>

            {/* Statistics */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Checks</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">High Risk</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.riskLevels.high}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Medium Risk</p>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.riskLevels.medium}</p>
                    </div>
                </div>
            )}

            {/* Risk Distribution Chart */}
            {stats && pieData.some(d => d.value > 0) && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Risk Distribution</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                                {pieData.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        >
                            <option value="pending">Pending</option>
                            <option value="all">All</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Risk Level
                        </label>
                        <select
                            value={riskFilter}
                            onChange={(e) => setRiskFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        >
                            <option value="all">All</option>
                            <option value="high">High (70+)</option>
                            <option value="medium">Medium (40-69)</option>
                            <option value="low">Low (&lt;40)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Flagged Listings */}
            <div className="space-y-4">
                {fraudChecks.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                        <p className="text-gray-500 dark:text-gray-400">No flagged listings found</p>
                    </div>
                ) : (
                    fraudChecks.map((check) => (
                        <div
                            key={check._id}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                        {check.hostelId.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Owner: {check.ownerId.username} ({check.ownerId.email})
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Flagged: {new Date(check.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className={`text-4xl font-bold ${getRiskColor(check.riskScore)}`}>
                                        {check.riskScore}
                                    </div>
                                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-2 ${getRiskBadge(check.riskScore)}`}>
                                        {check.riskScore >= 70 ? 'HIGH RISK' : check.riskScore >= 40 ? 'MEDIUM RISK' : 'LOW RISK'}
                                    </div>
                                </div>
                            </div>

                            {/* Flags */}
                            <div className="mb-4">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🚩 Detected Issues:</h4>
                                <div className="space-y-2">
                                    {check.flags.map((flag, idx) => (
                                        <div key={idx} className="flex items-start gap-2">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getSeverityBadge(flag.severity)}`}>
                                                {flag.severity.toUpperCase()}
                                            </span>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                {flag.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* AI Analysis */}
                            {check.aiAnalysis && (
                                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                                    <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">🤖 AI Analysis:</h4>
                                    <p className="text-sm text-blue-800 dark:text-blue-300">
                                        {JSON.parse(check.aiAnalysis).reasoning || 'Analyzed for potential fraud indicators'}
                                    </p>
                                </div>
                            )}

                            {/* Hostel Preview */}
                            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <strong>Description:</strong> {check.hostelId.description?.substring(0, 200) || 'No description'}
                                    {(check.hostelId.description?.length || 0) > 200 && '...'}
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                                    <strong>Price:</strong> Rs {check.hostelId.price?.toLocaleString()}/month
                                </p>
                            </div>

                            {/* Actions */}
                            {check.status === 'pending' && (
                                <div className="flex gap-2 mt-4">
                                    <Button
                                        onClick={() => setSelectedCheck(check)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        Review
                                    </Button>
                                </div>
                            )}

                            {check.status !== 'pending' && (
                                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        <strong>Status:</strong> {check.status.toUpperCase()}
                                        {check.reviewedBy && ` by ${check.reviewedBy.username}`}
                                        {check.reviewedAt && ` on ${new Date(check.reviewedAt).toLocaleString()}`}
                                    </p>
                                    {check.reviewNotes && (
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                            <strong>Notes:</strong> {check.reviewNotes}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Review Modal */}
            {selectedCheck && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Review Listing: {selectedCheck.hostelId.name}
                            </h2>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Review Notes (Optional)
                                </label>
                                <textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                    placeholder="Add any notes about your decision..."
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => handleReview(selectedCheck._id, 'approve')}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                >
                                    ✓ Approve Listing
                                </Button>
                                <Button
                                    onClick={() => handleReview(selectedCheck._id, 'reject')}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                >
                                    ✗ Reject Listing
                                </Button>
                                <Button
                                    onClick={() => {
                                        setSelectedCheck(null);
                                        setReviewNotes('');
                                    }}
                                    variant="secondary"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FraudDashboard;
