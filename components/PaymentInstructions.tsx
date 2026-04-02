import React, { useState } from 'react';

interface BankDetails {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban?: string;
    jazzCashNumber?: string;
    easyPaisaNumber?: string;
}

interface OwnerContact {
    name: string;
    phone?: string;
}

interface PaymentInstructionsProps {
    amount: number;
    bankDetails: BankDetails;
    ownerContact: OwnerContact;
    bookingId: string;
    onUploadReceipt: () => void;
}

const PaymentInstructions: React.FC<PaymentInstructionsProps> = ({
    amount,
    bankDetails,
    ownerContact,
    bookingId,
    onUploadReceipt
}) => {
    const [copied, setCopied] = useState<string | null>(null);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 animate-fade-in-up">
            <div className="text-center mb-8 pb-6 border-b-2 border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    💰 Payment Instructions
                </h2>
                <div className="inline-block px-8 py-4 bg-gradient-to-br from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500 rounded-xl text-white">
                    <span className="block text-sm opacity-90 mb-1">Total Amount:</span>
                    <span className="block text-3xl font-bold">PKR {amount.toLocaleString()}</span>
                </div>
            </div>

            <div className="mb-8">
                {/* Step 1 */}
                <div className="flex gap-4 mb-8">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                        1
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Transfer Money
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Choose any of the following payment methods:
                        </p>
                    </div>
                </div>

                {/* Bank Transfer */}
                <div className="ml-0 sm:ml-14 mb-6 bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                    <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        🏦 Bank Transfer
                    </h4>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-2 sm:gap-4 items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Bank Name:</span>
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                                <span className="flex-1 font-mono font-medium text-gray-900 dark:text-white">
                                    {bankDetails.bankName}
                                </span>
                                <button
                                    onClick={() => copyToClipboard(bankDetails.bankName, 'bank')}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm transition-all duration-200 active:scale-95 font-medium"
                                >
                                    {copied === 'bank' ? '✓' : '📋'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-2 sm:gap-4 items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Account Title:</span>
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                                <span className="flex-1 font-mono font-medium text-gray-900 dark:text-white">
                                    {bankDetails.accountTitle}
                                </span>
                                <button
                                    onClick={() => copyToClipboard(bankDetails.accountTitle, 'title')}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm transition-all duration-200 active:scale-95 font-medium"
                                >
                                    {copied === 'title' ? '✓' : '📋'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-2 sm:gap-4 items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Account Number:</span>
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                                <span className="flex-1 font-mono font-medium tracking-wide text-gray-900 dark:text-white">
                                    {bankDetails.accountNumber}
                                </span>
                                <button
                                    onClick={() => copyToClipboard(bankDetails.accountNumber, 'account')}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm transition-all duration-200 active:scale-95 font-medium"
                                >
                                    {copied === 'account' ? '✓' : '📋'}
                                </button>
                            </div>
                        </div>

                        {bankDetails.iban && (
                            <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-2 sm:gap-4 items-center">
                                <span className="text-sm text-gray-500 dark:text-gray-400">IBAN:</span>
                                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                                    <span className="flex-1 font-mono font-medium tracking-wide text-gray-900 dark:text-white">
                                        {bankDetails.iban}
                                    </span>
                                    <button
                                        onClick={() => copyToClipboard(bankDetails.iban!, 'iban')}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm transition-all duration-200 active:scale-95 font-medium"
                                    >
                                        {copied === 'iban' ? '✓' : '📋'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Wallets */}
                {(bankDetails.jazzCashNumber || bankDetails.easyPaisaNumber) && (
                    <div className="ml-0 sm:ml-14 mb-6 bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                            📱 Mobile Wallet
                        </h4>
                        <div className="space-y-4">
                            {bankDetails.jazzCashNumber && (
                                <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-2 sm:gap-4 items-center">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">JazzCash:</span>
                                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                                        <span className="flex-1 font-mono font-medium text-gray-900 dark:text-white">
                                            {bankDetails.jazzCashNumber}
                                        </span>
                                        <button
                                            onClick={() => copyToClipboard(bankDetails.jazzCashNumber!, 'jazz')}
                                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded text-sm transition-colors"
                                        >
                                            {copied === 'jazz' ? '✓' : '📋'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {bankDetails.easyPaisaNumber && (
                                <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-2 sm:gap-4 items-center">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">EasyPaisa:</span>
                                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                                        <span className="flex-1 font-mono font-medium text-gray-900 dark:text-white">
                                            {bankDetails.easyPaisaNumber}
                                        </span>
                                        <button
                                            onClick={() => copyToClipboard(bankDetails.easyPaisaNumber!, 'easy')}
                                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded text-sm transition-colors"
                                        >
                                            {copied === 'easy' ? '✓' : '📋'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2 */}
                <div className="flex gap-4 mb-8">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                        2
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Take Screenshot
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            After transferring, take a screenshot of the transaction confirmation
                        </p>
                    </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 mb-8">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                        3
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Upload Receipt
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Upload your payment receipt below for verification
                        </p>
                        <button
                            onClick={onUploadReceipt}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-medium rounded-xl transition-all duration-200 shadow-sm shadow-green-500/20 hover:-translate-y-0.5 active:scale-95"
                        >
                            📤 Upload Payment Receipt
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl mb-4 border border-blue-100 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Need Help?
                </h4>
                <p className="text-blue-900 dark:text-blue-100 mb-1">
                    Contact the owner: <strong>{ownerContact.name}</strong>
                </p>
                {ownerContact.phone && (
                    <p className="text-blue-900 dark:text-blue-100">
                        Phone: <a href={`tel:${ownerContact.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                            {ownerContact.phone}
                        </a>
                    </p>
                )}
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-600 p-4 rounded-xl text-yellow-900 dark:text-yellow-200">
                <strong>⚠️ Important:</strong> Your booking will be confirmed once the owner verifies your payment receipt (usually within 24 hours).
            </div>
        </div>
    );
};

export default PaymentInstructions;
