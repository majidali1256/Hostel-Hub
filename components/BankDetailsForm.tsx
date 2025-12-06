import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface BankDetails {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
    jazzCashNumber: string;
    easyPaisaNumber: string;
    verified?: boolean;
}

const PAKISTANI_BANKS = [
    'HBL (Habib Bank Limited)',
    'UBL (United Bank Limited)',
    'MCB (Muslim Commercial Bank)',
    'Allied Bank',
    'Meezan Bank',
    'Bank Alfalah',
    'Faysal Bank',
    'Standard Chartered',
    'Bank Al Habib',
    'Askari Bank',
    'Soneri Bank',
    'Summit Bank',
    'Silk Bank',
    'JS Bank',
    'Other'
];

const BankDetailsForm: React.FC = () => {
    const [bankDetails, setBankDetails] = useState<BankDetails>({
        bankName: '',
        accountTitle: '',
        accountNumber: '',
        iban: '',
        jazzCashNumber: '',
        easyPaisaNumber: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchBankDetails();
    }, []);

    const fetchBankDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.bankDetails) {
                setBankDetails(response.data.bankDetails);
            }
        } catch (error) {
            console.error('Error fetching bank details:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/users/bank-details`,
                bankDetails,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage({ type: 'success', text: 'Bank details updated successfully!' });
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Failed to update bank details'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setBankDetails({
            ...bankDetails,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    💳 Bank Account Details
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Add your bank details to receive payments from customers
                </p>
                {bankDetails.verified && (
                    <span className="inline-block mt-2 px-3 py-1 bg-green-600 text-white rounded-full text-sm">
                        ✓ Verified by Admin
                    </span>
                )}
            </div>

            {message && (
                <div className={`p-4 rounded-lg mb-6 ${message.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                    }`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        Bank Transfer Details
                    </h3>

                    <div className="mb-6">
                        <label htmlFor="bankName" className="block mb-2 text-gray-700 dark:text-gray-300 font-medium">
                            Bank Name *
                        </label>
                        <select
                            id="bankName"
                            name="bankName"
                            value={bankDetails.bankName}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        >
                            <option value="">Select Bank</option>
                            {PAKISTANI_BANKS.map(bank => (
                                <option key={bank} value={bank}>{bank}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="accountTitle" className="block mb-2 text-gray-700 dark:text-gray-300 font-medium">
                            Account Title *
                        </label>
                        <input
                            type="text"
                            id="accountTitle"
                            name="accountTitle"
                            value={bankDetails.accountTitle}
                            onChange={handleChange}
                            placeholder="Account holder name"
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="accountNumber" className="block mb-2 text-gray-700 dark:text-gray-300 font-medium">
                            Account Number *
                        </label>
                        <input
                            type="text"
                            id="accountNumber"
                            name="accountNumber"
                            value={bankDetails.accountNumber}
                            onChange={handleChange}
                            placeholder="1234567890123456"
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="iban" className="block mb-2 text-gray-700 dark:text-gray-300 font-medium">
                            IBAN (Optional but recommended)
                        </label>
                        <input
                            type="text"
                            id="iban"
                            name="iban"
                            value={bankDetails.iban}
                            onChange={handleChange}
                            placeholder="PK36SCBL0000001123456702"
                            maxLength={24}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                        <small className="block mt-1 text-gray-500 dark:text-gray-400 text-sm">
                            24 characters starting with PK
                        </small>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        Mobile Wallet (Optional)
                    </h3>

                    <div className="mb-6">
                        <label htmlFor="jazzCashNumber" className="block mb-2 text-gray-700 dark:text-gray-300 font-medium">
                            JazzCash Number
                        </label>
                        <input
                            type="tel"
                            id="jazzCashNumber"
                            name="jazzCashNumber"
                            value={bankDetails.jazzCashNumber}
                            onChange={handleChange}
                            placeholder="03001234567"
                            pattern="[0-9]{11}"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                        <small className="block mt-1 text-gray-500 dark:text-gray-400 text-sm">
                            11 digits (e.g., 03001234567)
                        </small>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="easyPaisaNumber" className="block mb-2 text-gray-700 dark:text-gray-300 font-medium">
                            EasyPaisa Number
                        </label>
                        <input
                            type="tel"
                            id="easyPaisaNumber"
                            name="easyPaisaNumber"
                            value={bankDetails.easyPaisaNumber}
                            onChange={handleChange}
                            placeholder="03001234567"
                            pattern="[0-9]{11}"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                        <small className="block mt-1 text-gray-500 dark:text-gray-400 text-sm">
                            11 digits (e.g., 03001234567)
                        </small>
                    </div>
                </div>

                <div className="flex justify-center mt-8">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        {loading ? 'Saving...' : 'Save Bank Details'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BankDetailsForm;
