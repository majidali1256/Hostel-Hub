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
        <div className="receipt-upload-modal">
            <div className="modal-overlay" onClick={onCancel}></div>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>📤 Upload Payment Receipt</h2>
                    <button className="close-btn" onClick={onCancel}>×</button>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="paymentMethod">Payment Method *</label>
                        <select
                            id="paymentMethod"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            required
                        >
                            <option value="">Select payment method</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="jazzcash">JazzCash</option>
                            <option value="easypaisa">EasyPaisa</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="transactionId">Transaction ID (Optional)</label>
                        <input
                            type="text"
                            id="transactionId"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="Enter transaction reference number"
                        />
                        <small>If available on your receipt</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="receipt">Payment Receipt/Screenshot *</label>
                        <div className="upload-area">
                            {previewUrl ? (
                                <div className="preview-container">
                                    <img src={previewUrl} alt="Receipt preview" />
                                    <button
                                        type="button"
                                        className="change-btn"
                                        onClick={() => {
                                            setReceiptImage('');
                                            setPreviewUrl('');
                                        }}
                                    >
                                        Change Image
                                    </button>
                                </div>
                            ) : (
                                <label htmlFor="receipt" className="upload-label">
                                    <div className="upload-icon">📷</div>
                                    <div className="upload-text">
                                        <strong>Click to upload</strong> or drag and drop
                                    </div>
                                    <div className="upload-hint">
                                        PNG, JPG up to 5MB
                                    </div>
                                    <input
                                        type="file"
                                        id="receipt"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="info-box">
                        <strong>💡 Tips for a clear receipt:</strong>
                        <ul>
                            <li>Make sure the amount is visible</li>
                            <li>Include the transaction date and time</li>
                            <li>Ensure the image is not blurry</li>
                            <li>Show the recipient's account details if possible</li>
                        </ul>
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={onCancel} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'Uploading...' : 'Submit Receipt'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .receipt-upload-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                }

                .modal-content {
                    position: relative;
                    background: white;
                    border-radius: 12px;
                    padding: 2rem;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .modal-header h2 {
                    margin: 0;
                    color: #1a1a1a;
                }

                .close-btn {
                    background: none;
                    border: none;
                    font-size: 2rem;
                    color: #6b7280;
                    cursor: pointer;
                    padding: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    transition: background 0.2s;
                }

                .close-btn:hover {
                    background: #f3f4f6;
                }

                .error-message {
                    background: #fee2e2;
                    color: #991b1b;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: #374151;
                    font-weight: 500;
                }

                .form-group input,
                .form-group select {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    font-size: 1rem;
                }

                .form-group input:focus,
                .form-group select:focus {
                    outline: none;
                    border-color: #3b82f6;
                }

                .form-group small {
                    display: block;
                    margin-top: 0.25rem;
                    color: #6b7280;
                    font-size: 0.875rem;
                }

                .upload-area {
                    border: 2px dashed #d1d5db;
                    border-radius: 8px;
                    padding: 2rem;
                    text-align: center;
                    transition: border-color 0.2s;
                }

                .upload-area:hover {
                    border-color: #3b82f6;
                }

                .upload-label {
                    cursor: pointer;
                    display: block;
                }

                .upload-icon {
                    font-size: 3rem;
                    margin-bottom: 0.5rem;
                }

                .upload-text {
                    color: #374151;
                    margin-bottom: 0.25rem;
                }

                .upload-hint {
                    color: #6b7280;
                    font-size: 0.875rem;
                }

                .preview-container {
                    position: relative;
                }

                .preview-container img {
                    max-width: 100%;
                    max-height: 300px;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }

                .change-btn {
                    padding: 0.5rem 1rem;
                    background: #6b7280;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.875rem;
                }

                .change-btn:hover {
                    background: #4b5563;
                }

                .info-box {
                    background: #eff6ff;
                    border-left: 4px solid #3b82f6;
                    padding: 1rem;
                    border-radius: 4px;
                    margin-bottom: 1.5rem;
                }

                .info-box strong {
                    color: #1e40af;
                    display: block;
                    margin-bottom: 0.5rem;
                }

                .info-box ul {
                    margin: 0;
                    padding-left: 1.5rem;
                    color: #1e3a8a;
                }

                .info-box li {
                    margin: 0.25rem 0;
                }

                .form-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                }

                .btn-secondary,
                .btn-primary {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .btn-secondary {
                    background: #f3f4f6;
                    color: #374151;
                }

                .btn-secondary:hover {
                    background: #e5e7eb;
                }

                .btn-primary {
                    background: #3b82f6;
                    color: white;
                }

                .btn-primary:hover:not(:disabled) {
                    background: #2563eb;
                }

                .btn-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default PaymentReceiptUpload;
