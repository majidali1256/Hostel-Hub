import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Ban, User } from 'lucide-react';

const ModerationQueue: React.FC = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<any>(null);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5001/api/admin/reports?status=pending', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setReports(data.reports || []);
        } catch (error) {
            console.error('Failed to load reports:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResolve = async (reportId: string, resolution: string, note: string) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5001/api/admin/reports/${reportId}/resolve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ resolution, note })
            });
            setSelectedReport(null);
            loadReports();
        } catch (error) {
            console.error('Failed to resolve report:', error);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading queue...</div>;

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-200px)] gap-4 lg:gap-6">
            {/* List */}
            <div className="w-full lg:w-1/3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[300px] lg:max-h-none">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <h3 className="font-bold text-gray-900 dark:text-white">Pending Reports ({reports.length})</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {reports.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">No pending reports 🎉</div>
                    ) : (
                        reports.map(report => (
                            <div
                                key={report._id}
                                onClick={() => setSelectedReport(report)}
                                className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedReport?._id === report._id ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-l-blue-600' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-gray-900 dark:text-white capitalize">{report.reason}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(report.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{report.description}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded uppercase">
                                        {report.targetModel}
                                    </span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">by {report.reporterId?.firstName || 'Unknown'}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Detail */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                {selectedReport ? (
                    <>
                        <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                <div>
                                    <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-1">Report Details</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">ID: {selectedReport._id}</p>
                                </div>
                                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 rounded-full text-sm font-medium">
                                    {selectedReport.status}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
                            {/* Reporter Info */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Reporter
                                </h4>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold">
                                        {selectedReport.reporterId?.firstName?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {selectedReport.reporterId?.firstName || 'Unknown'} {selectedReport.reporterId?.lastName || ''}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{selectedReport.reporterId?.email || 'No email'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Report Content */}
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Reason & Description
                                </h4>
                                <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 p-4 rounded-lg">
                                    <p className="font-medium text-red-800 dark:text-red-300 capitalize mb-1">{selectedReport.reason}</p>
                                    <p className="text-red-700 dark:text-red-200">{selectedReport.description}</p>
                                </div>
                            </div>

                            {/* Target Info */}
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Target Content</h4>
                                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Target ID: {selectedReport.targetId}</p>
                                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-gray-600 dark:text-gray-300 italic">
                                        [Content preview would be loaded here based on targetModel]
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 lg:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Resolution</h4>
                            <div className="flex flex-wrap gap-2 lg:gap-3">
                                <button
                                    onClick={() => handleResolve(selectedReport._id, 'dismissed', 'No violation found')}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 lg:px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 text-sm"
                                >
                                    <XCircle className="w-4 h-4" />
                                    <span className="hidden sm:inline">Dismiss</span>
                                </button>
                                <button
                                    onClick={() => handleResolve(selectedReport._id, 'warning', 'Warning issued')}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 lg:px-4 py-2 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900 text-sm"
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="hidden sm:inline">Warning</span>
                                </button>
                                <button
                                    onClick={() => handleResolve(selectedReport._id, 'delete_content', 'Content removed')}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 lg:px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 text-sm"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="hidden sm:inline">Delete</span>
                                </button>
                                <button
                                    onClick={() => handleResolve(selectedReport._id, 'ban', 'User banned')}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 lg:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                                >
                                    <Ban className="w-4 h-4" />
                                    <span className="hidden sm:inline">Ban User</span>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
                        Select a report to view details
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModerationQueue;
