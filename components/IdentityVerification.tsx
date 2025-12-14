import React, { useState, useEffect } from 'react';
import { api } from '../services/mongoService';
import Button from './Button';

interface VerificationStatus {
    status: 'unverified' | 'pending' | 'verified' | 'rejected';
    document?: string;
    rejectionReason?: string;
    verificationDate?: string;
}

const IdentityVerification: React.FC = () => {
    const [status, setStatus] = useState<VerificationStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const data = await api.verification.getStatus();
            setStatus(data);
        } catch (err) {
            console.error('Error fetching verification status:', err);
            // If API fails, default to unverified so user can still upload
            setStatus({ status: 'unverified' });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first.');
            return;
        }

        setUploading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await api.verification.uploadDocument(file);
            setStatus(prev => ({ ...prev, status: res.status, document: res.documentPath } as VerificationStatus));
            setSuccess('Document uploaded successfully! Verification is pending.');
            setFile(null);
        } catch (err: any) {
            setError(err.message || 'Failed to upload document.');
        } finally {
            setUploading(false);
        }
    };

    // Check if user can upload documents
    const canUpload = !status || status.status === 'unverified' || status.status === 'rejected';

    if (loading) return <div className="p-4 text-center dark:text-gray-300">Loading verification status...</div>;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-8">
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">📋 Identity Verification</h2>

            <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`text-lg font-semibold px-4 py-2 rounded-full ${status?.status === 'verified' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                            status?.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                                status?.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                                    'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}>
                        Status: {status?.status ? status.status.charAt(0).toUpperCase() + status.status.slice(1) : 'Unverified'}
                    </div>
                </div>

                {status?.status === 'verified' && (
                    <div className="text-green-600 dark:text-green-400">
                        <p>✅ Your identity has been verified on {new Date(status.verificationDate!).toLocaleDateString()}.</p>
                    </div>
                )}

                {status?.status === 'rejected' && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 mb-4">
                        <p className="font-semibold text-red-800 dark:text-red-200">Verification Rejected</p>
                        <p className="text-red-600 dark:text-red-300">{status.rejectionReason}</p>
                        <p className="text-sm mt-2 text-red-500 dark:text-red-400">Please upload a valid document (CNIC or Student Card).</p>
                    </div>
                )}

                {canUpload && (
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-300">
                            Please upload a clear image of your CNIC or Student ID Card to verify your identity.
                            This helps build trust in the Hostel Hub community.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 dark:text-gray-400
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-blue-50 file:text-blue-700
                                    hover:file:bg-blue-100
                                    dark:file:bg-gray-700 dark:file:text-gray-300
                                "
                            />
                            <Button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className="w-full sm:w-auto"
                            >
                                {uploading ? 'Uploading...' : '📤 Upload Document'}
                            </Button>
                        </div>

                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
                    </div>
                )}

                {status?.status === 'pending' && (
                    <div className="text-yellow-600 dark:text-yellow-400">
                        <p>⏳ Your document is under review. This usually takes 24-48 hours.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IdentityVerification;

