import React, { useState, useEffect } from 'react';
import SignatureCanvas from './SignatureCanvas';

interface AgreementViewerProps {
    agreementId: string;
    onClose?: () => void;
}

const AgreementViewer: React.FC<AgreementViewerProps> = ({ agreementId, onClose }) => {
    const [agreement, setAgreement] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showSignModal, setShowSignModal] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        loadAgreement();
        // Mock current user - in real app get from context
        const token = localStorage.getItem('hh_access_token');
        if (token) {
            // Decode token or fetch user profile
            // setCurrentUser(...)
        }
    }, [agreementId]);

    const loadAgreement = async () => {
        try {
            const token = localStorage.getItem('hh_access_token');
            const res = await fetch(`http://localhost:5001/api/agreements/${agreementId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setAgreement(data);
        } catch (error) {
            console.error('Failed to load agreement:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSign = async (signatureData: { type: string; data: string }) => {
        try {
            const token = localStorage.getItem('hh_access_token');
            await fetch(`http://localhost:5001/api/agreements/${agreementId}/sign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ signatureData })
            });
            setShowSignModal(false);
            loadAgreement(); // Reload to show signature
        } catch (error) {
            console.error('Failed to sign agreement:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
            case 'signed': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
            case 'pending': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
            case 'terminated': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
            default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading agreement...</div>;
    }

    if (!agreement) {
        return <div className="p-8 text-center text-red-500 dark:text-red-400">Agreement not found</div>;
    }

    return (
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 min-h-screen shadow-lg">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center z-10">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">{agreement.title}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${getStatusColor(agreement.status)}`}>
                            {agreement.status}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Version {agreement.version}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                        Download PDF
                    </button>
                    {agreement.status === 'pending' && (
                        <button
                            onClick={() => setShowSignModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Sign Agreement
                        </button>
                    )}
                    {onClose && (
                        <button onClick={onClose} className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-8 md:p-12 space-y-8">
                {/* Agreement Body */}
                <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: agreement.content }}
                />

                {/* Terms */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Terms & Conditions</h3>
                    <div className="space-y-4">
                        {agreement.terms.map((term: any, idx: number) => (
                            <div key={idx} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{term.title}</h4>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{term.content}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Signatures */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Signatures</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Landlord Signature */}
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Landlord / Owner</p>
                            {agreement.signatures.find((s: any) => s.role === 'landlord') ? (
                                <div className="space-y-2">
                                    <img
                                        src={agreement.signatures.find((s: any) => s.role === 'landlord').signatureId.signatureData}
                                        alt="Landlord Signature"
                                        className="h-16 object-contain"
                                    />
                                    <div className="border-t border-gray-300 dark:border-gray-600 pt-2">
                                        <p className="font-semibold text-gray-900 dark:text-white">{agreement.landlordId.firstName} {agreement.landlordId.lastName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Signed: {new Date(agreement.signatures.find((s: any) => s.role === 'landlord').signedAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-24 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500">
                                    Waiting for signature
                                </div>
                            )}
                        </div>

                        {/* Tenant Signature */}
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Tenant</p>
                            {agreement.signatures.find((s: any) => s.role === 'tenant') ? (
                                <div className="space-y-2">
                                    <img
                                        src={agreement.signatures.find((s: any) => s.role === 'tenant').signatureId.signatureData}
                                        alt="Tenant Signature"
                                        className="h-16 object-contain"
                                    />
                                    <div className="border-t border-gray-300 dark:border-gray-600 pt-2">
                                        <p className="font-semibold text-gray-900 dark:text-white">{agreement.tenantId.firstName} {agreement.tenantId.lastName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Signed: {new Date(agreement.signatures.find((s: any) => s.role === 'tenant').signedAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-24 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500">
                                    Waiting for signature
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sign Modal */}
            {showSignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <SignatureCanvas
                        onSave={handleSign}
                        onCancel={() => setShowSignModal(false)}
                    />
                </div>
            )}
        </div>
    );
};

export default AgreementViewer;
