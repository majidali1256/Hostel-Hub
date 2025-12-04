import React, { useEffect } from 'react';

const OAuthCallback: React.FC = () => {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');
        const userId = params.get('userId');

        console.log('OAuth Callback Params:', { accessToken, refreshToken, userId });

        if (accessToken && refreshToken && userId) {
            localStorage.setItem('token', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('userId', userId);

            // Redirect to dashboard
            console.log('Tokens set, redirecting to dashboard...');
            setTimeout(() => {
                window.location.replace('/');
            }, 100);
        } else {
            // Handle error
            console.error('Missing tokens in OAuth callback');
            setTimeout(() => {
                window.location.replace('/login?error=oauth_failed');
            }, 2000);
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-800">Completing login...</h2>
                <p className="text-gray-500 mb-4">Please wait while we redirect you.</p>
                <button
                    onClick={() => window.location.replace('/')}
                    className="text-blue-600 hover:underline text-sm"
                >
                    Click here if you are not redirected automatically
                </button>
            </div>
        </div>
    );
};

export default OAuthCallback;
