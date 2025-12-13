import React, { useState, useEffect } from 'react';
import { api } from '../../services/mongoService';
import Button from '../Button';

interface VerificationRequest {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    status: 'unverified' | 'pending' | 'verified' | 'rejected';
    document?: string;
    documents?: string[];
    profilePicture?: string;
    submittedAt: string;
    verificationDate?: string;
    rejectionReason?: string;
}

const VerificationReview: React.FC = () => {
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [currentDocIndex, setCurrentDocIndex] = useState(0);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    useEffect(() => {
        loadRequests();
    }, [filter]);

    const loadRequests = async () => {
        try {
            setIsLoading(true);
            const data = await api.verification.getAllRequests(filter);
            setRequests(data.requests || []);
        } catch (error) {
            console.error('Failed to load verification requests:', error);
            alert('Failed to load verification requests');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (userId: string) => {
        if (!confirm('Are you sure you want to approve this verification request?')) return;

        try {
            setIsProcessing(true);
            await api.verification.approveUser(userId);
            alert('User verified successfully!');
            loadRequests();
        } catch (error: any) {
            alert(error.message || 'Failed to approve user');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest) return;
        if (!rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        try {
            setIsProcessing(true);
            await api.verification.rejectUser(selectedRequest.id, rejectionReason);
            alert('Verification rejected');
            setIsRejectModalOpen(false);
            setRejectionReason('');
            setSelectedRequest(null);
            loadRequests();
        } catch (error: any) {
            alert(error.message || 'Failed to reject user');
        } finally {
            setIsProcessing(false);
        }
    };

    const openRejectModal = (request: VerificationRequest) => {
        setSelectedRequest(request);
        setRejectionReason('');
        setIsRejectModalOpen(true);
    };

    const openDocumentModal = (request: VerificationRequest) => {
        setSelectedRequest(request);
        setCurrentDocIndex(0);
        setIsDocumentModalOpen(true);
    };

    const getAllDocuments = (request: VerificationRequest): string[] => {
        const docs: string[] = [];
        if (request.document) docs.push(request.document);
        if (request.documents && request.documents.length > 0) {
            docs.push(...request.documents);
        }
        return docs;
    };

    const getDocumentUrl = (path: string): string => {
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        return `${apiUrl}/${path}`;
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            unverified: 'bg-gray-100 text-gray-700',
            pending: 'bg-yellow-100 text-yellow-700',
            verified: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700'
        };
        return badges[status as keyof typeof badges] || badges.unverified;
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading verification requests...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Filter by Status:</span>
                    <div className="flex gap-2 flex-wrap">
                        {['all', 'pending', 'verified', 'rejected', 'unverified'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === status
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{requests.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{requests.filter(r => r.status === 'pending').length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Verified</p>
                    <p className="text-2xl font-bold text-green-600">{requests.filter(r => r.status === 'verified').length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">{requests.filter(r => r.status === 'rejected').length}</p>
                </div>
            </div>

            {/* Requests List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Submitted</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Documents</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                    No verification requests found
                                </td>
                            </tr>
                        ) : (
                            requests.map(request => (
                                <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            {request.profilePicture ? (
                                                <img
                                                    src={getDocumentUrl(request.profilePicture)}
                                                    alt={request.username}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                    {(request.firstName || request.username || '?')[0].toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {request.firstName || request.username}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">@{request.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {request.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(request.status)}`}>
                                            {request.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(request.submittedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {getAllDocuments(request).length > 0 ? (
                                            <button
                                                onClick={() => openDocumentModal(request)}
                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                📄 View ({getAllDocuments(request).length})
                                            </button>
                                        ) : (
                                            <span className="text-gray-400">No documents</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {request.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApprove(request.id)}
                                                    disabled={isProcessing}
                                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    ✅ Approve
                                                </button>
                                                <button
                                                    onClick={() => openRejectModal(request)}
                                                    disabled={isProcessing}
                                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    ❌ Reject
                                                </button>
                                            </div>
                                        )}
                                        {request.status === 'rejected' && request.rejectionReason && (
                                            <div className="text-xs text-red-600">
                                                Reason: {request.rejectionReason}
                                            </div>
                                        )}
                                        {request.status === 'verified' && request.verificationDate && (
                                            <div className="text-xs text-green-600">
                                                Verified: {new Date(request.verificationDate).toLocaleDateString()}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Document Viewer Modal */}
            {isDocumentModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                📄 Verification Documents - {selectedRequest.username}
                            </h3>
                            <button
                                onClick={() => setIsDocumentModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-4">
                            {/* Document Navigation */}
                            {getAllDocuments(selectedRequest).length > 1 && (
                                <div className="flex items-center justify-center gap-4 mb-4">
                                    <button
                                        onClick={() => setCurrentDocIndex(Math.max(0, currentDocIndex - 1))}
                                        disabled={currentDocIndex === 0}
                                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50"
                                    >
                                        ← Previous
                                    </button>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Document {currentDocIndex + 1} of {getAllDocuments(selectedRequest).length}
                                    </span>
                                    <button
                                        onClick={() => setCurrentDocIndex(Math.min(getAllDocuments(selectedRequest).length - 1, currentDocIndex + 1))}
                                        disabled={currentDocIndex === getAllDocuments(selectedRequest).length - 1}
                                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50"
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}

                            {/* Document Display */}
                            <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto" style={{ minHeight: '400px', maxHeight: '60vh' }}>
                                {(() => {
                                    const docs = getAllDocuments(selectedRequest);
                                    const currentDoc = docs[currentDocIndex];
                                    const url = getDocumentUrl(currentDoc);

                                    if (currentDoc.match(/\.(pdf)$/i) || url.includes('.pdf')) {
                                        return (
                                            <iframe
                                                src={url}
                                                className="w-full h-[500px]"
                                                title="Document Preview"
                                            />
                                        );
                                    } else {
                                        return (
                                            <img
                                                src={url}
                                                alt={`Document ${currentDocIndex + 1}`}
                                                className="max-w-full max-h-[60vh] object-contain"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Document+Not+Found';
                                                }}
                                            />
                                        );
                                    }
                                })()}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-center gap-4 mt-4">
                                <a
                                    href={getDocumentUrl(getAllDocuments(selectedRequest)[currentDocIndex])}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    🔗 Open in New Tab
                                </a>
                                {selectedRequest.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setIsDocumentModalOpen(false);
                                                handleApprove(selectedRequest.id);
                                            }}
                                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                        >
                                            ✅ Approve
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsDocumentModalOpen(false);
                                                openRejectModal(selectedRequest);
                                            }}
                                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                        >
                                            ❌ Reject
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Reject Verification</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Please provide a reason for rejecting {selectedRequest?.username}'s verification:
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="e.g., Document is unclear, Expired document, etc."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            rows={4}
                        />
                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setIsRejectModalOpen(false);
                                    setSelectedRequest(null);
                                    setRejectionReason('');
                                }}
                                disabled={isProcessing}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleReject}
                                disabled={isProcessing || !rejectionReason.trim()}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {isProcessing ? 'Rejecting...' : 'Reject'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VerificationReview;

