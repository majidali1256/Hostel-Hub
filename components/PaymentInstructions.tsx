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
        <div className="payment-instructions">
            <div className="header">
                <h2>💰 Payment Instructions</h2>
                <div className="amount-box">
                    <span className="label">Total Amount:</span>
                    <span className="amount">PKR {amount.toLocaleString()}</span>
                </div>
            </div>

            <div className="instructions-section">
                <div className="step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                        <h3>Transfer Money</h3>
                        <p>Choose any of the following payment methods:</p>
                    </div>
                </div>

                {/* Bank Transfer */}
                <div className="payment-method">
                    <h4>🏦 Bank Transfer</h4>
                    <div className="details-grid">
                        <div className="detail-item">
                            <span className="detail-label">Bank Name:</span>
                            <div className="detail-value">
                                <span>{bankDetails.bankName}</span>
                                <button
                                    onClick={() => copyToClipboard(bankDetails.bankName, 'bank')}
                                    className="copy-btn"
                                >
                                    {copied === 'bank' ? '✓' : '📋'}
                                </button>
                            </div>
                        </div>

                        <div className="detail-item">
                            <span className="detail-label">Account Title:</span>
                            <div className="detail-value">
                                <span>{bankDetails.accountTitle}</span>
                                <button
                                    onClick={() => copyToClipboard(bankDetails.accountTitle, 'title')}
                                    className="copy-btn"
                                >
                                    {copied === 'title' ? '✓' : '📋'}
                                </button>
                            </div>
                        </div>

                        <div className="detail-item">
                            <span className="detail-label">Account Number:</span>
                            <div className="detail-value">
                                <span className="account-number">{bankDetails.accountNumber}</span>
                                <button
                                    onClick={() => copyToClipboard(bankDetails.accountNumber, 'account')}
                                    className="copy-btn"
                                >
                                    {copied === 'account' ? '✓' : '📋'}
                                </button>
                            </div>
                        </div>

                        {bankDetails.iban && (
                            <div className="detail-item">
                                <span className="detail-label">IBAN:</span>
                                <div className="detail-value">
                                    <span className="iban">{bankDetails.iban}</span>
                                    <button
                                        onClick={() => copyToClipboard(bankDetails.iban!, 'iban')}
                                        className="copy-btn"
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
                    <div className="payment-method">
                        <h4>📱 Mobile Wallet</h4>
                        <div className="details-grid">
                            {bankDetails.jazzCashNumber && (
                                <div className="detail-item">
                                    <span className="detail-label">JazzCash:</span>
                                    <div className="detail-value">
                                        <span>{bankDetails.jazzCashNumber}</span>
                                        <button
                                            onClick={() => copyToClipboard(bankDetails.jazzCashNumber!, 'jazz')}
                                            className="copy-btn"
                                        >
                                            {copied === 'jazz' ? '✓' : '📋'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {bankDetails.easyPaisaNumber && (
                                <div className="detail-item">
                                    <span className="detail-label">EasyPaisa:</span>
                                    <div className="detail-value">
                                        <span>{bankDetails.easyPaisaNumber}</span>
                                        <button
                                            onClick={() => copyToClipboard(bankDetails.easyPaisaNumber!, 'easy')}
                                            className="copy-btn"
                                        >
                                            {copied === 'easy' ? '✓' : '📋'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                        <h3>Take Screenshot</h3>
                        <p>After transferring, take a screenshot of the transaction confirmation</p>
                    </div>
                </div>

                <div className="step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                        <h3>Upload Receipt</h3>
                        <p>Upload your payment receipt below for verification</p>
                        <button onClick={onUploadReceipt} className="upload-btn">
                            📤 Upload Payment Receipt
                        </button>
                    </div>
                </div>
            </div>

            <div className="contact-section">
                <h4>Need Help?</h4>
                <p>Contact the owner: <strong>{ownerContact.name}</strong></p>
                {ownerContact.phone && (
                    <p>Phone: <a href={`tel:${ownerContact.phone}`}>{ownerContact.phone}</a></p>
                )}
            </div>

            <div className="note">
                <strong>⚠️ Important:</strong> Your booking will be confirmed once the owner verifies your payment receipt (usually within 24 hours).
            </div>

            <style>{`
                .payment-instructions {
                    max-width: 700px;
                    margin: 0 auto;
                    padding: 2rem;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.1);
                }

                .header {
                    text-align: center;
                    margin-bottom: 2rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 2px solid #e5e7eb;
                }

                .header h2 {
                    margin: 0 0 1rem 0;
                    color: #1a1a1a;
                }

                .amount-box {
                    display: inline-block;
                    padding: 1rem 2rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    color: white;
                }

                .amount-box .label {
                    display: block;
                    font-size: 0.875rem;
                    opacity: 0.9;
                    margin-bottom: 0.25rem;
                }

                .amount-box .amount {
                    display: block;
                    font-size: 2rem;
                    font-weight: bold;
                }

                .instructions-section {
                    margin-bottom: 2rem;
                }

                .step {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .step-number {
                    flex-shrink: 0;
                    width: 40px;
                    height: 40px;
                    background: #3b82f6;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 1.25rem;
                }

                .step-content {
                    flex: 1;
                }

                .step-content h3 {
                    margin: 0 0 0.5rem 0;
                    color: #1a1a1a;
                }

                .step-content p {
                    margin: 0;
                    color: #666;
                }

                .payment-method {
                    background: #f9fafb;
                    padding: 1.5rem;
                    border-radius: 8px;
                    margin: 1rem 0 1.5rem 3.5rem;
                }

                .payment-method h4 {
                    margin: 0 0 1rem 0;
                    color: #374151;
                }

                .details-grid {
                    display: grid;
                    gap: 1rem;
                }

                .detail-item {
                    display: grid;
                    grid-template-columns: 150px 1fr;
                    gap: 1rem;
                    align-items: center;
                }

                .detail-label {
                    color: #6b7280;
                    font-size: 0.875rem;
                }

                .detail-value {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: white;
                    padding: 0.75rem;
                    border-radius: 6px;
                    border: 1px solid #e5e7eb;
                }

                .detail-value span {
                    flex: 1;
                    font-family: 'Courier New', monospace;
                    font-weight: 500;
                }

                .account-number,
                .iban {
                    letter-spacing: 0.5px;
                }

                .copy-btn {
                    padding: 0.25rem 0.5rem;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: background 0.2s;
                }

                .copy-btn:hover {
                    background: #2563eb;
                }

                .upload-btn {
                    margin-top: 1rem;
                    padding: 0.75rem 1.5rem;
                    background: #10b981;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .upload-btn:hover {
                    background: #059669;
                }

                .contact-section {
                    background: #eff6ff;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }

                .contact-section h4 {
                    margin: 0 0 0.5rem 0;
                    color: #1e40af;
                }

                .contact-section p {
                    margin: 0.25rem 0;
                    color: #1e3a8a;
                }

                .contact-section a {
                    color: #2563eb;
                    text-decoration: none;
                }

                .contact-section a:hover {
                    text-decoration: underline;
                }

                .note {
                    background: #fef3c7;
                    border-left: 4px solid #f59e0b;
                    padding: 1rem;
                    border-radius: 4px;
                    color: #92400e;
                }

                @media (max-width: 640px) {
                    .payment-instructions {
                        padding: 1rem;
                    }

                    .detail-item {
                        grid-template-columns: 1fr;
                    }

                    .amount-box .amount {
                        font-size: 1.5rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default PaymentInstructions;
