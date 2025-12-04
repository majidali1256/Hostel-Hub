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
    const [rejectionReason, setRejectionReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-700">Filter by Status:</span>
                    <div className="flex gap-2">
                        {['all', 'pending', 'verified', 'rejected', 'unverified'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === status
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-gray-500 text-sm">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
                </div>
            </div>

            {/* Requests List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No verification requests found
                                </td>
                            </tr>
                        ) : (
                            requests.map(request => (
                                <tr key={request.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">
                                            {request.firstName || request.username}
                                        </div>
                                        <div className="text-sm text-gray-500">@{request.username}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {request.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(request.status)}`}>
                                            {request.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(request.submittedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {request.document ? (
                                            <a
                                                href={`http://localhost:5001/${request.document}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                View Document
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">No document</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {request.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApprove(request.id)}
                                                    disabled={isProcessing}
                                                    className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => openRejectModal(request)}
                                                    disabled={isProcessing}
                                                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                        {request.status === 'rejected' && request.rejectionReason && (
                                            <div className="text-xs text-red-600">
                                                Reason: {request.rejectionReason}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Reject Modal */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Verification</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Please provide a reason for rejecting {selectedRequest?.username}'s verification:
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="e.g., Document is unclear, Expired document, etc."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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
