import React, { useEffect } from 'react';

const OAuthCallback: React.FC = () => {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');
        const userId = params.get('userId');

        if (accessToken && refreshToken && userId) {
            localStorage.setItem('hh_access_token', accessToken);
            localStorage.setItem('hh_refresh_token', refreshToken);
            localStorage.setItem('hh_user_id', userId);

            // Redirect to dashboard
            window.location.href = '/';
        } else {
            // Handle error
            console.error('Missing tokens in OAuth callback');
            window.location.href = '/login?error=oauth_failed';
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-800">Completing login...</h2>
                <p className="text-gray-500">Please wait while we redirect you.</p>
            </div>
        </div>
    );
};

export default OAuthCallback;
