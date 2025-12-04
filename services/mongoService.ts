
import { User, Hostel } from '../types';

const API_URL = 'http://localhost:5001/api';

// Helper to get auth headers
const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

export const api = {
    auth: {
        login: async (email: string, password?: string) => {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Login failed');
            }
            const data = await res.json();
            localStorage.setItem('token', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('userId', data.user.id);
            return data.user;
        },
        signup: async (email: string, password?: string, userData?: any) => {
            const res = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, ...userData })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Signup failed');
            }
            const data = await res.json();
            localStorage.setItem('token', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('userId', data.user.id);
            return data.user;
        },
        onAuthStateChanged: (callback: (user: User | null) => void) => {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');

            if (token && userId) {
                fetch(`${API_URL}/users/${userId}`, {
                    headers: getAuthHeaders()
                })
                    .then(res => {
                        // Only logout if authentication actually failed (401)
                        if (res.status === 401) {
                            // Token is invalid, clear auth and logout
                            localStorage.removeItem('token');
                            localStorage.removeItem('refreshToken');
                            localStorage.removeItem('userId');
                            callback(null);
                        } else if (res.ok) {
                            // Successfully got user data
                            return res.json().then(user => callback(user));
                        } else {
                            // Other errors (500, 404, etc.) - keep user logged in
                            console.warn('Failed to fetch user profile, but keeping session active');
                            // Don't call callback - keep existing auth state
                        }
                    })
                    .catch((error) => {
                        // Network error - keep user logged in
                        console.warn('Network error fetching user, keeping session active:', error);
                        // Don't call callback - keep existing auth state
                    });
            } else {
                callback(null);
            }
            return () => { };
        },
        signOut: async () => {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userId');
            window.location.reload();
        },
        forgotPassword: async (email: string) => {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to send reset email');
            }
            return await res.json();
        },
        resetPassword: async (token: string, password: string) => {
            const res = await fetch(`${API_URL}/auth/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to reset password');
            }
            return await res.json();
        }
    },
    db: {
        getUser: async (id: string) => {
            const res = await fetch(`${API_URL}/users/${id}`, {
                headers: getAuthHeaders()
            });
            return res.ok ? await res.json() : null;
        },
        setUser: async (id: string, data: Partial<User> | FormData) => {
            const isFormData = data instanceof FormData;
            const headers: HeadersInit = isFormData
                ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                : getAuthHeaders();
            const body = isFormData ? data : JSON.stringify(data);

            const res = await fetch(`${API_URL}/users/${id}`, {
                method: 'POST',
                headers: headers,
                body: body
            });
            return await res.json();
        },
        subscribeToHostels: (callback: (hostels: Hostel[]) => void) => {
            const fetchHostels = () => {
                fetch(`${API_URL}/hostels`, {
                    headers: getAuthHeaders()
                })
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data)) {
                            callback(data);
                        } else {
                            console.error('Failed to fetch hostels:', data);
                            callback([]);
                        }
                    })
                    .catch(err => {
                        console.error('Error fetching hostels:', err);
                        callback([]);
                    });
            };
            fetchHostels();
            const interval = setInterval(fetchHostels, 5000);
            return () => clearInterval(interval);
        },
        getHostel: async (id: string) => {
            const res = await fetch(`${API_URL}/hostels/${id}`, {
                headers: getAuthHeaders()
            });
            if (!res.ok) return null;
            return await res.json();
        },
        addHostel: async (hostel: Omit<Hostel, 'id'> | FormData) => {
            const isFormData = hostel instanceof FormData;
            const headers = isFormData
                ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                : getAuthHeaders();
            const body = isFormData ? hostel : JSON.stringify(hostel);

            const res = await fetch(`${API_URL}/hostels`, {
                method: 'POST',
                headers: headers,
                body: body
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create hostel');
            }
            return await res.json();
        },
        updateHostel: async (hostel: Hostel | FormData) => {
            let id: string;
            let body: string | FormData;
            let headers: HeadersInit;

            if (hostel instanceof FormData) {
                id = hostel.get('id') as string;
                body = hostel;
                headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
            } else {
                id = hostel.id;
                body = JSON.stringify(hostel);
                headers = getAuthHeaders();
            }

            const res = await fetch(`${API_URL}/hostels/${id}`, {
                method: 'PUT',
                headers: headers,
                body: body
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to update hostel');
            }
            return await res.json();
        },
        deleteHostel: async (id: string) => {
            await fetch(`${API_URL}/hostels/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
        },
        addReview: async (hostelId: string, review: { rating: number; comment: string }) => {
            const res = await fetch(`${API_URL}/hostels/${hostelId}/reviews`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(review)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to add review');
            }
            return await res.json();
        },
        deleteReview: async (hostelId: string) => {
            const res = await fetch(`${API_URL}/hostels/${hostelId}/reviews`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to delete review');
            }
            return await res.json();
        }
    },
    bookings: {
        getMyBookings: async () => {
            const res = await fetch(`${API_URL}/bookings/my-bookings`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        create: async (booking: any) => {
            const res = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(booking)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create booking');
            }
            return await res.json();
        },
        getAll: async (status?: string) => {
            const url = status ? `${API_URL}/bookings?status=${status}` : `${API_URL}/bookings`;
            const res = await fetch(url, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        getById: async (id: string) => {
            const res = await fetch(`${API_URL}/bookings/${id}`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        getHostelBookings: async (hostelId: string) => {
            const res = await fetch(`${API_URL}/hostels/${hostelId}/bookings`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        confirm: async (id: string) => {
            const res = await fetch(`${API_URL}/bookings/${id}/confirm`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to confirm booking');
            }
            return await res.json();
        },
        cancel: async (id: string, reason?: string) => {
            const res = await fetch(`${API_URL}/bookings/${id}/cancel`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ reason })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to cancel booking');
            }
            return await res.json();
        },
        updateStatus: async (id: string, status: string, cancelReason?: string) => {
            const res = await fetch(`${API_URL}/bookings/${id}/status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status, cancelReason })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to update booking status');
            }
            return await res.json();
        },
        uploadReceipt: async (id: string, receiptFile: File) => {
            const formData = new FormData();
            formData.append('receipt', receiptFile);

            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/bookings/${id}/payment-receipt`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to upload receipt');
            }
        },
        checkAvailability: async (hostelId: string, checkIn: string, checkOut: string) => {
            const res = await fetch(`${API_URL}/bookings/check-availability`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hostelId, checkIn, checkOut })
            });
            return await res.json();
        },
        getAvailableDates: async (hostelId: string, startDate?: string, endDate?: string) => {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const url = `${API_URL}/hostels/${hostelId}/available-dates?${params.toString()}`;
            const res = await fetch(url);
            return await res.json();
        }
    },
    conversations: {
        getAll: async () => {
            const res = await fetch(`${API_URL}/conversations`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        create: async (participantId: string, hostelId?: string) => {
            const res = await fetch(`${API_URL}/conversations`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ participantId, hostelId })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create conversation');
            }
            return await res.json();
        },
        getById: async (id: string) => {
            const res = await fetch(`${API_URL}/conversations/${id}`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        getMessages: async (conversationId: string, limit?: number, before?: string) => {
            const params = new URLSearchParams();
            if (limit) params.append('limit', limit.toString());
            if (before) params.append('before', before);
            const url = `${API_URL}/conversations/${conversationId}/messages?${params.toString()}`;
            const res = await fetch(url, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        sendMessage: async (conversationId: string, content: string, type?: string) => {
            const res = await fetch(`${API_URL}/messages`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ conversationId, content, type })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to send message');
            }
            return await res.json();
        },
        markAsRead: async (messageId: string) => {
            const res = await fetch(`${API_URL}/messages/${messageId}/read`, {
                method: 'PATCH',
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        delete: async (id: string) => {
            const res = await fetch(`${API_URL}/conversations/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            return await res.json();
        }
    },
    appointments: {
        create: async (appointment: any) => {
            const res = await fetch(`${API_URL}/appointments`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(appointment)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create appointment');
            }
            return await res.json();
        },
        getAll: async (status?: string, upcoming?: boolean) => {
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            if (upcoming) params.append('upcoming', 'true');
            const url = `${API_URL}/appointments?${params.toString()}`;
            const res = await fetch(url, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        getById: async (id: string) => {
            const res = await fetch(`${API_URL}/appointments/${id}`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        update: async (id: string, updates: any) => {
            const res = await fetch(`${API_URL}/appointments/${id}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify(updates)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to update appointment');
            }
            return await res.json();
        },
        cancel: async (id: string, reason?: string) => {
            const res = await fetch(`${API_URL}/appointments/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
                body: JSON.stringify({ reason })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to cancel appointment');
            }
            return await res.json();
        }
    },
    reviews: {
        submit: async (review: any) => {
            const res = await fetch(`${API_URL}/reviews`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(review)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to submit review');
            }
            return await res.json();
        },
        getAll: async (filters?: { hostelId?: string; reviewerId?: string; minRating?: number }) => {
            const params = new URLSearchParams();
            if (filters?.hostelId) params.append('hostelId', filters.hostelId);
            if (filters?.reviewerId) params.append('reviewerId', filters.reviewerId);
            if (filters?.minRating) params.append('minRating', filters.minRating.toString());
            const url = `${API_URL}/reviews?${params.toString()}`;
            const res = await fetch(url);
            return await res.json();
        },
        getById: async (id: string) => {
            const res = await fetch(`${API_URL}/reviews/${id}`);
            return await res.json();
        },
        update: async (id: string, updates: any) => {
            const res = await fetch(`${API_URL}/reviews/${id}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify(updates)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to update review');
            }
            return await res.json();
        },
        delete: async (id: string) => {
            const res = await fetch(`${API_URL}/reviews/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        markHelpful: async (id: string) => {
            const res = await fetch(`${API_URL}/reviews/${id}/helpful`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        addResponse: async (id: string, content: string) => {
            const res = await fetch(`${API_URL}/reviews/${id}/response`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ content })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to add response');
            }
            return await res.json();
        },
        getHostelReviews: async (hostelId: string) => {
            const res = await fetch(`${API_URL}/hostels/${hostelId}/reviews`);
            return await res.json();
        },
        getHostelRating: async (hostelId: string) => {
            const res = await fetch(`${API_URL}/hostels/${hostelId}/rating`);
            return await res.json();
        },
        getUserReviews: async (userId: string) => {
            const res = await fetch(`${API_URL}/users/${userId}/reviews`);
            return await res.json();
        }
    },
    trustScore: {
        get: async (userId: string) => {
            const res = await fetch(`${API_URL}/users/${userId}/trust-score`);
            return await res.json();
        },
        update: async (userId: string) => {
            const res = await fetch(`${API_URL}/users/${userId}/trust-score/update`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        getBadges: async (userId: string) => {
            const res = await fetch(`${API_URL}/users/${userId}/badges`);
            return await res.json();
        }
    },
    notifications: {
        getAll: async (unreadOnly?: boolean) => {
            const params = unreadOnly ? '?unreadOnly=true' : '';
            const res = await fetch(`${API_URL}/notifications${params}`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        getUnreadCount: async () => {
            const res = await fetch(`${API_URL}/notifications/unread`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        markAsRead: async (id: string) => {
            const res = await fetch(`${API_URL}/notifications/${id}/read`, {
                method: 'PATCH',
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        markAllAsRead: async () => {
            const res = await fetch(`${API_URL}/notifications/read-all`, {
                method: 'PATCH',
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        delete: async (id: string) => {
            const res = await fetch(`${API_URL}/notifications/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        getPreferences: async () => {
            const res = await fetch(`${API_URL}/notifications/preferences`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        updatePreferences: async (preferences: any) => {
            const res = await fetch(`${API_URL}/notifications/preferences`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify(preferences)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to update preferences');
            }
            return await res.json();
        }
    },
    fraud: {
        submitReport: async (report: any) => {
            const res = await fetch(`${API_URL}/fraud/report`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(report)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to submit fraud report');
            }
            return await res.json();
        },
        getReports: async (filters?: { status?: string; riskLevel?: string }) => {
            const params = new URLSearchParams();
            if (filters?.status) params.append('status', filters.status);
            if (filters?.riskLevel) params.append('riskLevel', filters.riskLevel);
            const url = `${API_URL}/fraud/reports?${params.toString()}`;
            const res = await fetch(url, { headers: getAuthHeaders() });
            return await res.json();
        },
        getReport: async (id: string) => {
            const res = await fetch(`${API_URL}/fraud/reports/${id}`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        updateReport: async (id: string, updates: any) => {
            const res = await fetch(`${API_URL}/fraud/reports/${id}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify(updates)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to update report');
            }
            return await res.json();
        },
        deleteReport: async (id: string) => {
            const res = await fetch(`${API_URL}/fraud/reports/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        checkImages: async (images: string[], hostelId: string) => {
            const res = await fetch(`${API_URL}/fraud/check-images`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ images, hostelId })
            });
            return await res.json();
        },
        checkText: async (text: string) => {
            const res = await fetch(`${API_URL}/fraud/check-text`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ text })
            });
            return await res.json();
        },
        calculateRisk: async (hostelId: string) => {
            const res = await fetch(`${API_URL}/fraud/calculate-risk/${hostelId}`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        getStats: async () => {
            const res = await fetch(`${API_URL}/fraud/stats`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        getFlaggedHostels: async () => {
            const res = await fetch(`${API_URL}/fraud/flagged-hostels`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        }
    },
    roommate: {
        getPreferences: async () => {
            const res = await fetch(`${API_URL}/roommate/preferences`, {
                headers: getAuthHeaders()
            });
            if (res.status === 404) return null;
            return await res.json();
        },
        savePreferences: async (preferences: any) => {
            const res = await fetch(`${API_URL}/roommate/preferences`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(preferences)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save preferences');
            }
            return await res.json();
        },
        deletePreferences: async () => {
            const res = await fetch(`${API_URL}/roommate/preferences`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        getMatches: async (limit?: number) => {
            const params = limit ? `?limit=${limit}` : '';
            const res = await fetch(`${API_URL}/roommate/matches${params}`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        getCompatibility: async (userId: string) => {
            const res = await fetch(`${API_URL}/roommate/matches/${userId}`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        sendMatchRequest: async (userId: string) => {
            const res = await fetch(`${API_URL}/roommate/matches/${userId}`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to send match request');
            }
            return await res.json();
        },
        respondToMatch: async (matchId: string, action: 'accept' | 'decline') => {
            const res = await fetch(`${API_URL}/roommate/matches/${matchId}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ action })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to respond to match');
            }
            return await res.json();
        },
        search: async (filters?: any) => {
            const params = new URLSearchParams();
            if (filters?.gender) params.append('gender', filters.gender);
            if (filters?.minAge) params.append('minAge', filters.minAge.toString());
            if (filters?.maxAge) params.append('maxAge', filters.maxAge.toString());
            if (filters?.minBudget) params.append('minBudget', filters.minBudget.toString());
            if (filters?.maxBudget) params.append('maxBudget', filters.maxBudget.toString());
            const url = `${API_URL}/roommate/search?${params.toString()}`;
            const res = await fetch(url, { headers: getAuthHeaders() });
            return await res.json();
        }
    },
    price: {
        getAnalysis: async (hostelId: string) => {
            const res = await fetch(`${API_URL}/price/analysis/${hostelId}`, {
                headers: getAuthHeaders()
            });
            if (res.status === 404) return null;
            return await res.json();
        },
        runAnalysis: async (hostelId: string) => {
            const res = await fetch(`${API_URL}/price/analysis/${hostelId}`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to run analysis');
            }
            return await res.json();
        },
        getRecommendations: async (hostelId: string) => {
            const res = await fetch(`${API_URL}/price/recommendations/${hostelId}`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        getHistory: async (hostelId: string, days?: number) => {
            const params = days ? `?days=${days}` : '';
            const res = await fetch(`${API_URL}/price/history/${hostelId}${params}`, {
                headers: getAuthHeaders()
            });
            if (res.status === 404) return [];
            return await res.json();
        },
        getMarketTrends: async (location: string) => {
            const res = await fetch(`${API_URL}/price/market/${encodeURIComponent(location)}`, {
                headers: getAuthHeaders()
            });
            if (res.status === 404) return null;
            return await res.json();
        },
        getCompetitors: async (hostelId: string) => {
            const res = await fetch(`${API_URL}/price/competitors/${hostelId}`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        getForecast: async (location: string, days?: number) => {
            const params = days ? `?days=${days}` : '';
            const res = await fetch(`${API_URL}/price/forecast/${encodeURIComponent(location)}${params}`, {
                headers: getAuthHeaders()
            });
            if (res.status === 404) return null;
            return await res.json();
        },
        getMarketComparison: async (hostelId: string) => {
            const res = await fetch(`${API_URL}/price/market-comparison/${hostelId}`, {
                headers: getAuthHeaders()
            });
            if (res.status === 404) return null;
            return await res.json();
        }
    },
    agreements: {
        getAll: async (role?: 'landlord' | 'tenant') => {
            const params = role ? `?role=${role}` : '';
            const res = await fetch(`${API_URL}/agreements${params}`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        getById: async (id: string) => {
            const res = await fetch(`${API_URL}/agreements/${id}`, {
                headers: getAuthHeaders()
            });
            if (res.status === 404) return null;
            return await res.json();
        },
        create: async (data: { bookingId: string; templateId: string }) => {
            const res = await fetch(`${API_URL}/agreements`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create agreement');
            }
            return await res.json();
        },
        sign: async (id: string, signatureData: { type: string; data: string }) => {
            const res = await fetch(`${API_URL}/agreements/${id}/sign`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ signatureData })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to sign agreement');
            }
            return await res.json();
        },
        terminate: async (id: string, reason: string) => {
            const res = await fetch(`${API_URL}/agreements/${id}/terminate`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ reason })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to terminate agreement');
            }
            return await res.json();
        },
        getTemplates: async () => {
            const res = await fetch(`${API_URL}/agreement-templates`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        createTemplate: async (data: any) => {
            const res = await fetch(`${API_URL}/agreement-templates`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create template');
            }
            return await res.json();
        }
    },
    admin: {
        getStats: async () => {
            const res = await fetch(`${API_URL}/admin/stats`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        getUsers: async (params?: any) => {
            const query = new URLSearchParams(params).toString();
            const res = await fetch(`${API_URL}/admin/users?${query}`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        performUserAction: async (userId: string, action: string, reason: string) => {
            const res = await fetch(`${API_URL}/admin/users/${userId}/action`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ action, reason })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to perform action');
            }
            return await res.json();
        },
        getReports: async (status: string = 'pending') => {
            const res = await fetch(`${API_URL}/admin/reports?status=${status}`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        resolveReport: async (reportId: string, resolution: string, note: string) => {
            const res = await fetch(`${API_URL}/admin/reports/${reportId}/resolve`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ resolution, note })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to resolve report');
            }
            return await res.json();
        },
        getSettings: async () => {
            const res = await fetch(`${API_URL}/admin/settings`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        updateSetting: async (key: string, value: any) => {
            const res = await fetch(`${API_URL}/admin/settings/${key}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ value })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to update setting');
            }
            return await res.json();
        }
    },
    verification: {
        uploadDocument: async (file: File) => {
            const formData = new FormData();
            formData.append('document', file);
            const res = await fetch(`${API_URL}/verification/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to upload document');
            }
            return await res.json();
        },
        getStatus: async () => {
            const res = await fetch(`${API_URL}/verification/status`, {
                headers: getAuthHeaders()
            });
            return await res.json();
        },
        // Admin methods
        getAllRequests: async (status?: string) => {
            const params = status ? `?status=${status}` : '';
            const res = await fetch(`${API_URL}/verification/admin/all${params}`, {
                headers: getAuthHeaders()
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to fetch verification requests');
            }
            return await res.json();
        },
        approveUser: async (userId: string) => {
            const res = await fetch(`${API_URL}/verification/review/${userId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status: 'verified' })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to approve user');
            }
            return await res.json();
        },
        rejectUser: async (userId: string, reason: string) => {
            const res = await fetch(`${API_URL}/verification/review/${userId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status: 'rejected', reason })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to reject user');
            }
            return await res.json();
        }
    },
    search: {
        filterHostels: async (filters: any) => {
            const params = new URLSearchParams();
            if (filters.priceRange) {
                params.append('minPrice', filters.priceRange[0].toString());
                params.append('maxPrice', filters.priceRange[1].toString());
            }
            if (filters.amenities?.length) {
                params.append('amenities', filters.amenities.join(','));
            }
            if (filters.roomCategories?.length) {
                params.append('roomCategories', filters.roomCategories.join(','));
            }
            if (filters.genderPreference && filters.genderPreference !== 'any') {
                params.append('genderPreference', filters.genderPreference);
            }
            if (filters.minRating) {
                params.append('minRating', filters.minRating.toString());
            }
            if (filters.verifiedOnly) {
                params.append('verifiedOnly', 'true');
            }

            const res = await fetch(`${API_URL}/hostels/search?${params.toString()}`);
            if (!res.ok) throw new Error('Search failed');
            return await res.json();
        },
        getNearby: async (lat: number, lng: number, radius?: number) => {
            const params = new URLSearchParams({
                lat: lat.toString(),
                lng: lng.toString(),
                ...(radius && { radius: radius.toString() })
            });
            const res = await fetch(`${API_URL}/hostels/nearby?${params.toString()}`);
            if (!res.ok) throw new Error('Nearby search failed');
            return await res.json();
        },
        getRecommendations: async () => {
            const res = await fetch(`${API_URL}/hostels/recommendations`, {
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Failed to get recommendations');
            return await res.json();
        }
    }
};
