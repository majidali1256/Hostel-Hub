import React, { useState } from 'react';
import Button from './Button';

interface ReviewFormProps {
    hostelId: string;
    hostelName: string;
    bookingId?: string;
    onSuccess?: () => void;
    onClose: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
    hostelId,
    hostelName,
    bookingId,
    onSuccess,
    onClose
}) => {
    const [rating, setRating] = useState(5);
    const [cleanliness, setCleanliness] = useState(5);
    const [accuracy, setAccuracy] = useState(5);
    const [communication, setCommunication] = useState(5);
    const [location, setLocation] = useState(5);
    const [value, setValue] = useState(5);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!title.trim() || !comment.trim()) {
            setError('Please provide a title and comment');
            return;
        }

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5001/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    hostelId,
                    bookingId,
                    rating,
                    cleanliness,
                    accuracy,
                    communication,
                    location,
                    value,
                    title,
                    comment
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit review');
            }

            onSuccess?.();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
        <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                    >
                        <svg
                            className={`w-6 h-6 ${star <= value ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            viewBox="0 0 20 20"
                        >
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-6 border-b border-gray-200 rounded-t-2xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
                            <p className="text-gray-600 mt-1">{hostelName}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Overall Rating */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl">
                        <StarRating value={rating} onChange={setRating} label="Overall Rating" />
                    </div>

                    {/* Detailed Ratings */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900">Detailed Ratings</h3>
                        <div className="space-y-2">
                            <StarRating value={cleanliness} onChange={setCleanliness} label="Cleanliness" />
                            <StarRating value={accuracy} onChange={setAccuracy} label="Accuracy" />
                            <StarRating value={communication} onChange={setCommunication} label="Communication" />
                            <StarRating value={location} onChange={setLocation} label="Location" />
                            <StarRating value={value} onChange={setValue} label="Value for Money" />
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                            Review Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Summarize your experience"
                            maxLength={100}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
                    </div>

                    {/* Comment */}
                    <div>
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                            Your Review
                        </label>
                        <textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience with this hostel..."
                            rows={6}
                            maxLength={2000}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">{comment.length}/2000 characters</p>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            fullWidth
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            fullWidth
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewForm;
