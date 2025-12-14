import React, { useState } from 'react';
import Button from './Button';
import Input from './Input';
import { User } from '../types';
import { api } from '../services/mongoService';
import axios from 'axios';

interface LoginProps {
  onSignUpSubmit: (uid: string, userData: Omit<User, 'id' | 'role'>) => void;
  onLoginSuccess?: (user: User) => void;
}

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.804 9.692C34.522 5.834 29.632 3.5 24 3.5 11.737 3.5 1.5 13.737 1.5 26S11.737 48.5 24 48.5c12.263 0 22.5-9.715 22.5-22.5 0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691L12.543 19.92c1.438-2.42 3.86-4.131 6.691-4.634V3.5H6.306z" />
    <path fill="#4CAF50" d="M24 48.5c5.632 0 10.522-2.334 14.191-6.192l-6.236-5.228c-1.895 1.229-4.27 1.92-6.955 1.92-5.22 0-9.657-3.342-11.249-7.87l-6.522 5.028C6.386 42.112 14.46 48.5 24 48.5z" />
    <path fill="#1976D2" d="M43.611 20.083H24v8h11.303c-.792 2.237-2.231 4.16-4.082 5.565L38.804 39.5c4.185-3.856 6.691-9.338 6.691-15.583 0-1.341-.138-2.65-.389-3.917z" />
  </svg>
);
const FacebookIcon = () => (
  <svg className="h-6 w-6" fill="#1877F2" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.675 0h-21.35C.582 0 0 .582 0 1.325v21.351C0 23.418.582 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.742 0 1.325-.582 1.325-1.325V1.325C24 .582 23.418 0 22.675 0z" />
  </svg>
);
const AppleIcon = () => (
  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12.152,5.882c-0.34-0.843-0.938-1.343-1.688-1.343c-1.049,0-1.948,0.765-2.588,1.915c-1.428,2.602-0.816,6.343,1.218,8.22c0.509,0.469,1.045,0.729,1.644,0.729c0.119,0,0.24-0.01,0.358-0.031c0.826-0.156,1.488-0.656,1.888-1.329c-1.319-0.813-2.158-2.251-2.158-3.856c0-2.016,1.238-3.6,2.948-4.228C13.292,6.01,12.592,5.882,12.152,5.882z M15.118,2.029C14.268,2.01,12.7,2.58,11.7,3.689C10.7,2.58,9.2,2.01,8.35,2.029c-2.3,0.01-4.35,1.881-5.35,4.352C1.65,10.042,2.8,14.653,5.45,17.47c1.4,1.499,3.1,2.25,4.8,2.25c0.1,0,0.2,0,0.3,0c1.7-0.063,3.3-0.8,4.5-1.9c1.4-1.2,2.3-2.8,2.6-4.5c0.3-1.8-0.2-3.6-1.2-5.1C18.618,3.91,17.418,2.049,15.118,2.029z"></path>
  </svg>
);

const Login: React.FC<LoginProps> = ({ onSignUpSubmit, onLoginSuccess }) => {
  const [view, setView] = useState<'login' | 'signup' | 'forgotPassword' | 'resetPassword'>('login');

  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [role, setRole] = useState<'owner' | 'customer'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState('');

  // Reset state when switching views
  React.useEffect(() => {
    setError(null);
    setMessage(null);
    setIsLoading(false);
    setUsername('');
    setFirstName('');
    setLastName('');
    setContactNumber('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }, [view]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

      if (view === 'login') {
        // Real backend login
        console.log('Login: Sending login request...');
        const response = await axios.post(`${apiUrl}/api/auth/login`, {
          email: email.trim(),
          password
        });
        console.log('Login: Response received', response.data);

        const { accessToken, refreshToken, user } = response.data;

        // Store tokens in localStorage
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userId', user._id || user.id);

        // Call parent callback with user data
        if (onLoginSuccess) {
          console.log('Login: Calling onLoginSuccess');
          onLoginSuccess({
            id: user._id || user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            contactNumber: user.contactNumber || '',
            role: user.role,
            stayHistory: user.stayHistory || [],
            profilePicture: user.profilePicture
          });
        }
      } else if (view === 'signup') {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        const hasUpperCase = /[A-Z]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (!hasUpperCase || !hasSpecialChar) {
          throw new Error("Password must contain at least one capital letter and one special character.");
        }

        // Real backend signup
        const signupResponse = await axios.post(`${apiUrl}/api/auth/signup`, {
          email: email.trim(),
          password,
          username: username.trim(),
          firstName,
          lastName,
          contactNumber,
          role
        });

        console.log("Signup successful:", signupResponse.data);

        // Auto-login after successful signup
        const loginResponse = await axios.post(`${apiUrl}/api/auth/login`, {
          email: email.trim(),
          password
        });

        const { accessToken, refreshToken, user } = loginResponse.data;

        // Store tokens in localStorage
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userId', user._id || user.id);

        // Call parent callback with user data
        if (onLoginSuccess) {
          onLoginSuccess({
            id: user._id || user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            contactNumber: user.contactNumber || '',
            role: user.role,
            stayHistory: user.stayHistory || [],
            profilePicture: user.profilePicture
          });
        }
      } else if (view === 'forgotPassword') {
        // Call forgot password API
        await api.auth.forgotPassword(email);
        setMessage(`A password reset code has been sent to ${email}. Please check your email and enter the code below.`);
        setView('resetPassword');
      } else if (view === 'resetPassword') {
        // Reset password with token
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        await api.auth.resetPassword(resetToken, password);
        setMessage('Password reset successfully! Please log in with your new password.');
        setView('login');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'facebook' | 'apple') => {
    setError(null);
    setMessage(null);
    setIsLoading(true);

    const backendUrl = 'http://localhost:5001'; // Should be env var in production

    if (provider === 'google') {
      window.location.href = `${backendUrl}/api/auth/google`;
    } else if (provider === 'facebook') {
      window.location.href = `${backendUrl}/api/auth/facebook`;
    } else {
      alert("Apple login not implemented yet.");
      setIsLoading(false);
    }
  };

  const renderTitle = () => {
    switch (view) {
      case 'login': return 'Welcome to Hostel Hub';
      case 'signup': return 'Create an Account';
      case 'forgotPassword': return 'Reset Your Password';
      case 'resetPassword': return 'Enter Reset Code';
    }
  };

  const renderSubtitle = () => {
    switch (view) {
      case 'login': return 'Sign in to find your ideal stay.';
      case 'signup': return 'Get started by creating your account.';
      case 'forgotPassword': return 'Enter your email to receive a password reset code.';
      case 'resetPassword': return 'Enter the code from your email and your new password.';
    }
  };

  const renderSocialButtons = () => (
    <>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">Or continue with</span>
        </div>
      </div>

      <div className="space-y-3">
        <Button type="button" variant="secondary" fullWidth className="!font-semibold !bg-white dark:!bg-gray-700 !text-gray-600 dark:!text-gray-200 border border-gray-300 dark:border-gray-600 hover:!bg-gray-50 dark:hover:!bg-gray-600 flex items-center justify-center gap-3" onClick={() => handleSocialLogin('google')}>
          <GoogleIcon />
          <span>Continue with Google</span>
        </Button>
        <Button type="button" variant="secondary" fullWidth className="!font-semibold !bg-white dark:!bg-gray-700 !text-gray-600 dark:!text-gray-200 border border-gray-300 dark:border-gray-600 hover:!bg-gray-50 dark:hover:!bg-gray-600 flex items-center justify-center gap-3" onClick={() => handleSocialLogin('facebook')}>
          <FacebookIcon />
          <span>Continue with Facebook</span>
        </Button>
      </div>
    </>
  );

  const renderFormContent = () => {
    switch (view) {
      case 'resetPassword':
        return (
          <>
            <Input
              id="resetToken"
              label="Reset Code"
              type="text"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              placeholder="Enter the code from your email"
              required

            />
            <Input
              id="password"
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required

            />
            <Input
              id="confirmPassword"
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required

            />
            <Button type="submit" fullWidth disabled={isLoading} >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </>
        );
      case 'forgotPassword':
        return (
          <>
            <Input
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required

            />
            <Button type="submit" fullWidth disabled={isLoading} >
              {isLoading ? 'Sending...' : 'Send Reset Code'}
            </Button>
          </>
        );
      case 'signup':
        return (
          <>
            <Input
              id="username"
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., majidali22"
              required

            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="firstName"
                label="First Name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Majid"
                required

              />
              <Input
                id="lastName"
                label="Last Name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ali"
                required

              />
            </div>
            <Input
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required

            />
            <Input
              id="contactNumber"
              label="Contact Number"
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="0300-1234567"
              required

            />

            <div className="space-y-2">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                I am a
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'owner' | 'customer')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="customer">Customer (Looking for hostels)</option>
                <option value="owner">Owner (Listing hostels)</option>
              </select>
            </div>

            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required

            />
            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-4 pl-1">Must contain at least one capital letter and one special character.</p>
            <Input
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required

            />
            <Button type="submit" fullWidth disabled={isLoading} >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
            {renderSocialButtons()}
          </>
        );
      case 'login':
      default:
        return (
          <>
            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required

            />
            <Input
              id="password"
              label={
                <div className="flex justify-between items-center">
                  <span>Password</span>
                  <a href="#" onClick={(e) => { e.preventDefault(); setView('forgotPassword'); }} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Forgot Password?
                  </a>
                </div>
              }
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required

            />
            <Button type="submit" fullWidth disabled={isLoading} >
              {isLoading ? 'Logging In...' : 'Login'}
            </Button>

            {renderSocialButtons()}
          </>
        );
    }
  }

  const renderFooterLink = () => {
    switch (view) {
      case 'forgotPassword':
        return (
          <p className="text-gray-500 dark:text-gray-400">
            Remember your password?{' '}
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500" onClick={(e) => { e.preventDefault(); setView('login'); }}>
              Back to Login
            </a>
          </p>
        );
      case 'signup':
        return (
          <p className="text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500" onClick={(e) => { e.preventDefault(); setView('login'); }}>
              Login
            </a>
          </p>
        );
      case 'login':
      default:
        return (
          <p className="text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500" onClick={(e) => { e.preventDefault(); setView('signup'); }}>
              Sign up
            </a>
          </p>
        );
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="inline-block bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            {renderTitle()}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {renderSubtitle()}
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>

          {error && <p className="text-red-500 dark:text-red-400 text-sm font-semibold text-center bg-red-50 dark:bg-red-900/30 p-3 rounded-md">{error}</p>}
          {message && <p className="text-green-600 dark:text-green-400 text-sm font-semibold text-center bg-green-50 dark:bg-green-900/30 p-3 rounded-md">{message}</p>}

          {renderFormContent()}

          <div className="text-sm text-center">
            {renderFooterLink()}
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-4">
              <p>© 2025 Hostel Hub. All rights reserved.</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;