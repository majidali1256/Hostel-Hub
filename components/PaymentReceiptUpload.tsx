import React, { useState } from 'react';
import axios from 'axios';

interface PaymentReceiptUploadProps {
    bookingId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const PaymentReceiptUpload: React.FC<PaymentReceiptUploadProps> = ({
    bookingId,
    onSuccess,
    onCancel
}) => {
    const [paymentMethod, setPaymentMethod] = useState<string>('');
    const [transactionId, setTransactionId] = useState<string>('');
    const [receiptImage, setReceiptImage] = useState<string>('');
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        setError('');

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setReceiptImage(base64String);
            setPreviewUrl(base64String);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!paymentMethod) {
            setError('Please select a payment method');
            return;
        }

        if (!receiptImage) {
            setError('Please upload a payment receipt');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}/payment-receipt`,
                {
                    paymentMethod,
                    transactionId,
                    receiptImage
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to upload receipt');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onCancel}></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-xl p-8 max-w-lg w-11/12 max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        📤 Upload Payment Receipt
                    </h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-8 h-8 flex items-center justify-center rounded transition-colors text-3xl"
                    >
                        ×
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label htmlFor="paymentMethod" className="block mb-2 text-gray-700 dark:text-gray-300 font-medium">
                            Payment Method *
                        </label>
                        <select
                            id="paymentMethod"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Select payment method</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="jazzcash">JazzCash</option>
                            <option value="easypaisa">EasyPaisa</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="transactionId" className="block mb-2 text-gray-700 dark:text-gray-300 font-medium">
                            Transaction ID (Optional)
                        </label>
                        <input
                            type="text"
                            id="transactionId"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="Enter transaction reference number"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <small className="block mt-1 text-gray-500 dark:text-gray-400 text-sm">
                            If available on your receipt
                        </small>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="receipt" className="block mb-2 text-gray-700 dark:text-gray-300 font-medium">
                            Payment Receipt/Screenshot *
                        </label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 rounded-lg p-8 text-center transition-colors">
                            {previewUrl ? (
                                <div>
                                    <img
                                        src={previewUrl}
                                        alt="Receipt preview"
                                        className="max-w-full max-h-72 rounded-lg mb-4 mx-auto"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReceiptImage('');
                                            setPreviewUrl('');
                                        }}
                                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white rounded-md text-sm transition-colors"
                                    >
                                        Change Image
                                    </button>
                                </div>
                            ) : (
                                <label htmlFor="receipt" className="cursor-pointer block">
                                    <div className="text-5xl mb-2">📷</div>
                                    <div className="text-gray-700 dark:text-gray-300 mb-1">
                                        <strong>Click to upload</strong> or drag and drop
                                    </div>
                                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                                        PNG, JPG up to 5MB
                                    </div>
                                    <input
                                        type="file"
                                        id="receipt"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-4 rounded mb-6">
                        <strong className="block text-blue-800 dark:text-blue-200 mb-2">
                            💡 Tips for a clear receipt:
                        </strong>
                        <ul className="list-disc pl-6 text-blue-900 dark:text-blue-100 space-y-1">
                            <li>Make sure the amount is visible</li>
                            <li>Include the transaction date and time</li>
                            <li>Ensure the image is not blurry</li>
                            <li>Show the recipient's account details if possible</li>
                        </ul>
                    </div>

                    <div className="flex gap-4 justify-end">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                        >
                            {loading ? 'Uploading...' : 'Submit Receipt'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentReceiptUpload;
