import React, { useState, useEffect } from 'react';
import AgreementViewer from './AgreementViewer';
import { api } from '../services/mongoService';

interface AgreementDashboardProps {
    user: any;
}

const AgreementDashboard: React.FC<AgreementDashboardProps> = ({ user }) => {
    const [agreements, setAgreements] = useState<any[]>([]);
    const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadAgreements();
    }, []);

    const loadAgreements = async () => {
        try {
            console.log('Loading agreements...');
            const data = await api.agreements.getAll();
            console.log('Agreements data:', data);

            // Check if data is an array, otherwise set empty array
            if (Array.isArray(data)) {
                setAgreements(data);
            } else {
                setAgreements([]);
                if (data?.error) {
                    console.log('Agreements API error:', data.error);
                }
            }
        } catch (error) {
            console.error('Failed to load agreements:', error);
            setAgreements([]);
        } finally {
            setIsLoading(false);
        }
    };

    if (selectedAgreementId) {
        return (
            <AgreementViewer
                agreementId={selectedAgreementId}
                onClose={() => setSelectedAgreementId(null)}
            />
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">My Agreements</h2>
            </div>

            {isLoading ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading agreements...</div>
            ) : agreements.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center border border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Agreements Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400">Agreements will appear here when you book a hostel or create a lease.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {agreements.map(agreement => (
                        <div
                            key={agreement._id}
                            onClick={() => setSelectedAgreementId(agreement._id)}
                            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center"
                        >
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">{agreement.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {agreement.hostelId?.name} • {new Date(agreement.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${agreement.status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                                    agreement.status === 'signed' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                                        agreement.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                                            'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                    }`}>
                                    {agreement.status}
                                </span>
                                <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AgreementDashboard;
