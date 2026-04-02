import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from './Button';

const VerifyEmail: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const res = await fetch(`http://localhost:5001/api/auth/verify-email/${token}`);
                const data = await res.json();

                if (res.ok) {
                    setStatus('success');
                    setMessage('Email verified successfully! You can now log in.');
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Verification failed. The link may be invalid or expired.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('An error occurred during verification. Please try again.');
            }
        };

        if (token) {
            verifyEmail();
        }
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center animate-scale-in border border-gray-100 dark:border-gray-700">
                {status === 'verifying' && (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verifying Email</h2>
                        <p className="text-gray-600 dark:text-gray-400">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                            <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Email Verified!</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
                        <Button onClick={() => navigate('/')} fullWidth>
                            Go to Login
                        </Button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                            <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verification Failed</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
                        <Button onClick={() => navigate('/')} variant="secondary" fullWidth>
                            Back to Home
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
