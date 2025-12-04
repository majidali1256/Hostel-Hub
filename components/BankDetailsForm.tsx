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
        <div className="bank-details-form">
            <div className="form-header">
                <h2>💳 Bank Account Details</h2>
                <p>Add your bank details to receive payments from customers</p>
                {bankDetails.verified && (
                    <span className="verified-badge">✓ Verified by Admin</span>
                )}
            </div>

            {message && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-section">
                    <h3>Bank Transfer Details</h3>

                    <div className="form-group">
                        <label htmlFor="bankName">Bank Name *</label>
                        <select
                            id="bankName"
                            name="bankName"
                            value={bankDetails.bankName}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Bank</option>
                            {PAKISTANI_BANKS.map(bank => (
                                <option key={bank} value={bank}>{bank}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="accountTitle">Account Title *</label>
                        <input
                            type="text"
                            id="accountTitle"
                            name="accountTitle"
                            value={bankDetails.accountTitle}
                            onChange={handleChange}
                            placeholder="Account holder name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="accountNumber">Account Number *</label>
                        <input
                            type="text"
                            id="accountNumber"
                            name="accountNumber"
                            value={bankDetails.accountNumber}
                            onChange={handleChange}
                            placeholder="1234567890123456"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="iban">IBAN (Optional but recommended)</label>
                        <input
                            type="text"
                            id="iban"
                            name="iban"
                            value={bankDetails.iban}
                            onChange={handleChange}
                            placeholder="PK36SCBL0000001123456702"
                            maxLength={24}
                        />
                        <small>24 characters starting with PK</small>
                    </div>
                </div>

                <div className="form-section">
                    <h3>Mobile Wallet (Optional)</h3>

                    <div className="form-group">
                        <label htmlFor="jazzCashNumber">JazzCash Number</label>
                        <input
                            type="tel"
                            id="jazzCashNumber"
                            name="jazzCashNumber"
                            value={bankDetails.jazzCashNumber}
                            onChange={handleChange}
                            placeholder="03001234567"
                            pattern="[0-9]{11}"
                        />
                        <small>11 digits (e.g., 03001234567)</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="easyPaisaNumber">EasyPaisa Number</label>
                        <input
                            type="tel"
                            id="easyPaisaNumber"
                            name="easyPaisaNumber"
                            value={bankDetails.easyPaisaNumber}
                            onChange={handleChange}
                            placeholder="03001234567"
                            pattern="[0-9]{11}"
                        />
                        <small>11 digits (e.g., 03001234567)</small>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Saving...' : 'Save Bank Details'}
                    </button>
                </div>
            </form>

            <style>{`
                .bank-details-form {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 2rem;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .form-header {
                    margin-bottom: 2rem;
                    text-align: center;
                }

                .form-header h2 {
                    margin: 0 0 0.5rem 0;
                    color: #1a1a1a;
                }

                .form-header p {
                    color: #666;
                    margin: 0;
                }

                .verified-badge {
                    display: inline-block;
                    margin-top: 0.5rem;
                    padding: 0.25rem 0.75rem;
                    background: #10b981;
                    color: white;
                    border-radius: 20px;
                    font-size: 0.875rem;
                }

                .message {
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1.5rem;
                }

                .message.success {
                    background: #d1fae5;
                    color: #065f46;
                }

                .message.error {
                    background: #fee2e2;
                    color: #991b1b;
                }

                .form-section {
                    margin-bottom: 2rem;
                    padding-bottom: 2rem;
                    border-bottom: 1px solid #e5e7eb;
                }

                .form-section:last-of-type {
                    border-bottom: none;
                }

                .form-section h3 {
                    margin: 0 0 1rem 0;
                    color: #374151;
                    font-size: 1.125rem;
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
                    transition: border-color 0.2s;
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

                .form-actions {
                    display: flex;
                    justify-content: center;
                    margin-top: 2rem;
                }

                .btn-primary {
                    padding: 0.75rem 2rem;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
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

export default BankDetailsForm;
