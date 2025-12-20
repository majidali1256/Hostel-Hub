import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Review {
    _id: string;
    reviewerId: {
        _id: string;
        firstName: string;
        lastName: string;
        profilePicture?: string;
    };
    rating: number;
    cleanliness?: number;
    accuracy?: number;
    communication?: number;
    location?: number;
    value?: number;
    title: string;
    comment: string;
    helpfulVotes: string[];
    response?: {
        content: string;
        responderId: {
            firstName: string;
            lastName: string;
        };
        respondedAt: Date;
    };
    createdAt: Date;
}

interface ReviewListProps {
    hostelId: string;
    currentUserId?: string;
}

const ReviewList: React.FC<ReviewListProps> = ({ hostelId, currentUserId }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadReviews();
    }, [hostelId]);

    const loadReviews = async () => {
        try {
            const res = await fetch(`http://localhost:5001/api/hostels/${hostelId}/reviews`);
            const data = await res.json();
            setReviews(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleHelpful = async (reviewId: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5001/api/reviews/${reviewId}/helpful`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                loadReviews(); // Reload to update helpful count
            }
        } catch (err) {
            console.error('Failed to mark helpful:', err);
        }
    };

    const StarDisplay = ({ rating }: { rating: number }) => (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star}
                    className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    viewBox="0 0 20 20"
                >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
            ))}
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="text-gray-500">Loading reviews...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <p className="text-gray-600 font-medium">No reviews yet</p>
                <p className="text-gray-500 text-sm mt-1">Be the first to review this hostel!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {reviews.map((review) => {
                const isHelpful = currentUserId && review.helpfulVotes.includes(currentUserId);

                return (
                    <div key={review._id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                    {review.reviewerId.firstName[0]}{review.reviewerId.lastName[0]}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">
                                        {review.reviewerId.firstName} {review.reviewerId.lastName}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                        {format(new Date(review.createdAt), 'MMMM d, yyyy')}
                                    </p>
                                </div>
                            </div>
                            <StarDisplay rating={review.rating} />
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-lg text-gray-900 mb-2">{review.title}</h3>

                        {/* Comment */}
                        <p className="text-gray-700 mb-4">{review.comment}</p>

                        {/* Detailed Ratings */}
                        {(review.cleanliness || review.accuracy || review.communication || review.location || review.value) && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
                                {review.cleanliness && (
                                    <div className="text-center">
                                        <p className="text-xs text-gray-600 mb-1">Cleanliness</p>
                                        <p className="font-semibold text-gray-900">{review.cleanliness.toFixed(1)}</p>
                                    </div>
                                )}
                                {review.accuracy && (
                                    <div className="text-center">
                                        <p className="text-xs text-gray-600 mb-1">Accuracy</p>
                                        <p className="font-semibold text-gray-900">{review.accuracy.toFixed(1)}</p>
                                    </div>
                                )}
                                {review.communication && (
                                    <div className="text-center">
                                        <p className="text-xs text-gray-600 mb-1">Communication</p>
                                        <p className="font-semibold text-gray-900">{review.communication.toFixed(1)}</p>
                                    </div>
                                )}
                                {review.location && (
                                    <div className="text-center">
                                        <p className="text-xs text-gray-600 mb-1">Location</p>
                                        <p className="font-semibold text-gray-900">{review.location.toFixed(1)}</p>
                                    </div>
                                )}
                                {review.value && (
                                    <div className="text-center">
                                        <p className="text-xs text-gray-600 mb-1">Value</p>
                                        <p className="font-semibold text-gray-900">{review.value.toFixed(1)}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Owner Response */}
                        {review.response && (
                            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                                    </svg>
                                    <p className="font-semibold text-blue-900">
                                        Response from {review.response.responderId.firstName}
                                    </p>
                                </div>
                                <p className="text-blue-800">{review.response.content}</p>
                                <p className="text-xs text-blue-600 mt-2">
                                    {format(new Date(review.response.respondedAt), 'MMMM d, yyyy')}
                                </p>
                            </div>
                        )}

                        {/* Helpful Button */}
                        {currentUserId && (
                            <div className="mt-4 flex items-center gap-2">
                                <button
                                    onClick={() => handleHelpful(review._id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isHelpful
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                    </svg>
                                    <span className="text-sm font-medium">
                                        Helpful ({review.helpfulVotes.length})
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ReviewList;
