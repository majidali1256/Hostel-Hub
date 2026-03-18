import React, { useState } from 'react';
import { api } from '../services/mongoService';

interface LoginProps {
    onLoginSuccess: (user: any) => void;
    onSignUpSubmit: (uid: string, userData: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onSignUpSubmit }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Login form state
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Signup form state
    const [signupData, setSignupData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });

    // Forgot password state
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotStep, setForgotStep] = useState<'email' | 'code' | 'password'>('email');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    // Step 1: Send reset code to email
    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            await api.auth.forgotPassword(forgotEmail);
            setSuccessMessage('A 6-digit code has been sent to your email.');
            setForgotStep('code');
        } catch (err: any) {
            setError(err.message || 'Failed to send reset code');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify the code
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            await api.auth.verifyResetCode(forgotEmail, resetCode);
            setSuccessMessage('Code verified! Enter your new password.');
            setForgotStep('password');
        } catch (err: any) {
            setError(err.message || 'Invalid or expired code');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 3: Reset password with code
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (newPassword !== confirmNewPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            await api.auth.resetPasswordWithCode(forgotEmail, resetCode, newPassword);
            setSuccessMessage('Password reset successfully! You can now log in.');
            // Reset all state and go back to login
            setTimeout(() => {
                setIsForgotPassword(false);
                setForgotStep('email');
                setForgotEmail('');
                setResetCode('');
                setNewPassword('');
                setConfirmNewPassword('');
                setSuccessMessage('');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const user = await api.auth.login(loginEmail, loginPassword);
            if (user) {
                onLoginSuccess(user);
            }
        } catch (err: any) {
            setError('Wrong Email or Password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (signupData.password !== signupData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (signupData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            const result = await api.auth.signup(
                signupData.email,
                signupData.password,
                { username: signupData.username }
            );

            if (result && result.id) {
                onSignUpSubmit(result.id, {
                    firstName: signupData.firstName,
                    lastName: signupData.lastName,
                    username: signupData.username,
                    email: signupData.email,
                    phone: signupData.phone,
                });
            }
        } catch (err: any) {
            setError(err.message || 'Signup failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        // Google OAuth - redirect to backend OAuth endpoint
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        window.location.href = `${apiUrl}/api/auth/google`;
    };


    return (
        <div className="h-screen flex overflow-hidden bg-white dark:bg-[#0a0a0a] transition-colors duration-500 font-sans">
            {/* Left Side - Branding Panel (60% width) - Pure White */}
            <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden bg-white dark:bg-[#0a0a0a]">
                {/* Content Container - Centered */}
                <div className="relative z-10 flex flex-col justify-center items-center w-full h-full p-16">
                    {/* Large Hero Icon */}
                    <div className="mb-8 flex flex-col items-center group cursor-default">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-10 rounded-[2.5rem] shadow-2xl shadow-blue-500/25 dark:shadow-blue-500/40 transition-all duration-500 group-hover:scale-105 group-hover:shadow-blue-500/40 group-hover:-translate-y-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-28 w-28 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-blue-600 dark:text-blue-500">
                            HostelHub
                        </h1>
                        <p className="mt-4 text-xl text-gray-500 dark:text-gray-400 font-light tracking-wide">
                            Home, away from Home.
                        </p>
                    </div>

                    {/* Minimalist Feature Tags */}
                    <div className="flex flex-wrap justify-center gap-4 mt-10">
                        {[
                            { title: 'Home For Students', icon: 'M12 14l9-5-9-5-9 5 9 5z' },
                            { title: 'Verified Listing', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                            { title: 'Instant Booking', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
                        ].map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-3 px-5 py-3 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default group">
                                <div className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                                    </svg>
                                </div>
                                <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">{feature.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form (40% width) */}
            <div className="w-full lg:w-[40%] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden">
                {/* Elevated Card Container */}
                <div className="w-full max-w-[400px] bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/50 p-5 sm:p-6 border border-gray-100 dark:border-gray-800">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex flex-col items-center mb-4">
                        <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/30 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-blue-600 dark:text-blue-500">HostelHub</h2>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex p-1 mb-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                        <button
                            onClick={() => { setIsSignUp(false); setError(''); }}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${!isSignUp
                                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-100 dark:ring-gray-700'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => { setIsSignUp(true); setError(''); }}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${isSignUp
                                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-100 dark:ring-gray-700'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-3 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium animate-fade-in flex items-center gap-2">
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {successMessage && (
                        <div className="mb-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-green-600 dark:text-green-400 text-xs font-medium animate-fade-in flex items-center gap-2">
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {successMessage}
                        </div>
                    )}

                    {/* Forms - Minimalist Inputs */}
                    {isForgotPassword ? (
                        <div className="space-y-4">
                            {/* Step indicator */}
                            <div className="flex justify-center gap-2 mb-4">
                                <div className={`w-2 h-2 rounded-full ${forgotStep === 'email' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                                <div className={`w-2 h-2 rounded-full ${forgotStep === 'code' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                                <div className={`w-2 h-2 rounded-full ${forgotStep === 'password' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                            </div>

                            {/* Step 1: Enter Email */}
                            {forgotStep === 'email' && (
                                <form onSubmit={handleSendCode} className="space-y-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                                        Enter your email to receive a 6-digit reset code.
                                    </p>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Email</label>
                                        <input
                                            type="email"
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-200 outline-none"
                                            placeholder="Enter your email"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Sending...' : 'Send Code'}
                                    </button>
                                </form>
                            )}

                            {/* Step 2: Enter Code */}
                            {forgotStep === 'code' && (
                                <form onSubmit={handleVerifyCode} className="space-y-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                                        Enter the 6-digit code sent to <span className="font-medium text-blue-600">{forgotEmail}</span>
                                    </p>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Verification Code</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={resetCode}
                                            onChange={(e) => setResetCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-200 outline-none text-center text-2xl tracking-[0.5em] font-mono"
                                            placeholder="000000"
                                            maxLength={6}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading || resetCode.length !== 6}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Verifying...' : 'Verify Code'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setForgotStep('email'); setResetCode(''); setError(''); }}
                                        className="w-full py-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                                    >
                                        ← Change Email
                                    </button>
                                </form>
                            )}

                            {/* Step 3: Enter New Password */}
                            {forgotStep === 'password' && (
                                <form onSubmit={handleResetPassword} className="space-y-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                                        Enter your new password.
                                    </p>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">New Password</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-200 outline-none"
                                                placeholder="Enter new password"
                                                minLength={6}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Confirm Password</label>
                                            <input
                                                type="password"
                                                value={confirmNewPassword}
                                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-200 outline-none"
                                                placeholder="Confirm new password"
                                                minLength={6}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                </form>
                            )}

                            {/* Back to Login */}
                            <button
                                type="button"
                                onClick={() => { setIsForgotPassword(false); setForgotStep('email'); setError(''); setSuccessMessage(''); setResetCode(''); setForgotEmail(''); }}
                                className="w-full py-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                            >
                                ← Back to Login
                            </button>
                        </div>
                    ) : !isSignUp ? (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Email</label>
                                <input
                                    type="email"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-200 outline-none"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
                                    <button type="button" onClick={() => { setIsForgotPassword(true); setError(''); }} className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400 transition-colors">Forgot Password?</button>
                                </div>
                                <input
                                    type="password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-200 outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                            >
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSignUp} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1">First Name</label>
                                    <input
                                        type="text"
                                        value={signupData.firstName}
                                        onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value.replace(/[^a-zA-Z\s]/g, '') })}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-white outline-none transition-all text-sm"
                                        placeholder="John"
                                        pattern="[A-Za-z\s]+"
                                        title="Only letters allowed"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={signupData.lastName}
                                        onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value.replace(/[^a-zA-Z\s]/g, '') })}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-white outline-none transition-all text-sm"
                                        placeholder="Doe"
                                        pattern="[A-Za-z\s]+"
                                        title="Only letters allowed"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={signupData.username}
                                    onChange={(e) => setSignupData({ ...signupData, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-white outline-none transition-all text-sm"
                                    placeholder="Username"
                                    pattern="[A-Za-z0-9_]+"
                                    title="Letters, numbers and underscores only"
                                    minLength={3}
                                    required
                                />
                                <input
                                    type="email"
                                    value={signupData.email}
                                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-white outline-none transition-all text-sm"
                                    placeholder="Email Address"
                                    required
                                />
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    value={signupData.phone}
                                    onChange={(e) => setSignupData({ ...signupData, phone: e.target.value.replace(/[^0-9]/g, '') })}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-white outline-none transition-all text-sm"
                                    placeholder="Phone Number (e.g. 03001234567)"
                                    pattern="[0-9]{10,15}"
                                    title="Enter a valid phone number (10-15 digits)"
                                    minLength={10}
                                    maxLength={15}
                                    required
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="password"
                                        value={signupData.password}
                                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-white outline-none transition-all text-sm"
                                        placeholder="Password"
                                        required
                                    />
                                    <input
                                        type="password"
                                        value={signupData.confirmPassword}
                                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-white outline-none transition-all text-sm"
                                        placeholder="Confirm"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                            >
                                {isLoading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </form>
                    )}

                    {/* Divider */}
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-3 bg-white dark:bg-gray-900 text-gray-500 font-medium">Or continue with</span>
                        </div>
                    </div>

                    {/* Social Stack - Vertical & Full Width */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group text-gray-700 dark:text-white font-medium text-sm"
                        >
                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>
                        <button
                            onClick={() => {
                                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
                                window.location.href = `${apiUrl}/api/auth/facebook`;
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#1877F2] text-white rounded-xl hover:bg-[#166fe5] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-blue-500/20 group font-medium text-sm"
                        >
                            <svg className="w-4 h-4 bg-white rounded-full p-0.5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="#1877F2">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Facebook
                        </button>
                    </div>

                    {/* Footer text */}
                    <div className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
                        <p>
                            By continuing, you agree to our <a href="#" className="hover:text-gray-900 dark:hover:text-white underline transition-colors">Terms</a> and <a href="#" className="hover:text-gray-900 dark:hover:text-white underline transition-colors">Privacy</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
