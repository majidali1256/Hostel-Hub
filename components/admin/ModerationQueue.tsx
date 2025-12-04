import React, { useState, useEffect } from 'react';

const ModerationQueue: React.FC = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<any>(null);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            const token = localStorage.getItem('hh_access_token');
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
            const token = localStorage.getItem('hh_access_token');
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

    if (isLoading) return <div className="p-8 text-center">Loading queue...</div>;

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6">
            {/* List */}
            <div className="w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-bold text-gray-900">Pending Reports ({reports.length})</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {reports.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No pending reports 🎉</div>
                    ) : (
                        reports.map(report => (
                            <div
                                key={report._id}
                                onClick={() => setSelectedReport(report)}
                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedReport?._id === report._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-gray-900 capitalize">{report.reason}</span>
                                    <span className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-gray-600 truncate">{report.description}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded uppercase">
                                        {report.targetModel}
                                    </span>
                                    <span className="text-xs text-gray-400">by {report.reporterId.firstName}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Detail */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                {selectedReport ? (
                    <>
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-1">Report Details</h2>
                                    <p className="text-sm text-gray-500">ID: {selectedReport._id}</p>
                                </div>
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                                    {selectedReport.status}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Reporter Info */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Reporter</h4>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                                        {selectedReport.reporterId.firstName[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedReport.reporterId.firstName} {selectedReport.reporterId.lastName}
                                        </p>
                                        <p className="text-xs text-gray-500">{selectedReport.reporterId.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Report Content */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Reason & Description</h4>
                                <div className="bg-red-50 border border-red-100 p-4 rounded-lg">
                                    <p className="font-medium text-red-800 capitalize mb-1">{selectedReport.reason}</p>
                                    <p className="text-red-700">{selectedReport.description}</p>
                                </div>
                            </div>

                            {/* Target Info (Mock) */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Target Content</h4>
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <p className="text-sm text-gray-500 mb-2">Target ID: {selectedReport.targetId}</p>
                                    <div className="bg-gray-100 p-3 rounded text-gray-600 italic">
                                        [Content preview would be loaded here based on targetModel]
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 border-t border-gray-200 bg-gray-50">
                            <h4 className="font-medium text-gray-900 mb-3">Resolution</h4>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleResolve(selectedReport._id, 'dismissed', 'No violation found')}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Dismiss Report
                                </button>
                                <button
                                    onClick={() => handleResolve(selectedReport._id, 'warning', 'Warning issued')}
                                    className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200"
                                >
                                    Issue Warning
                                </button>
                                <button
                                    onClick={() => handleResolve(selectedReport._id, 'delete_content', 'Content removed')}
                                    className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
                                >
                                    Delete Content
                                </button>
                                <button
                                    onClick={() => handleResolve(selectedReport._id, 'ban', 'User banned')}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Ban User
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        Select a report to view details
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModerationQueue;
