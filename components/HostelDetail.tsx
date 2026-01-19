import React, { useState, useEffect } from 'react';
import { Hostel, User } from '../types';
import { useToast } from '../contexts/ToastContext';
import Button from './Button';
import FairnessBadge from './FairnessBadge';
import TrustBadge from './TrustBadge';
import AppointmentScheduler from './AppointmentScheduler';
import ReviewsModal from './ReviewsModal';

interface HostelDetailProps {
    hostel: Hostel;
    user: User;
    owner?: User;
    onBack: () => void;
    onEdit: (hostel: Hostel) => void;
    onDelete: (hostelId: string) => void;
    onToggleStatus?: (hostelId: string, newStatus: 'Available' | 'Inactive') => void;
    onRate: (hostelId: string, score: number, comment?: string) => void;
    onClearRating: (hostelId: string) => void;
    onMarkAsStayed: (hostelId: string) => void;
    onMessageOwner: (ownerId: string) => void;
    onBook: (hostelId: string) => void;
}

const StarRating: React.FC<{ hostelId: string; userRating?: number; onRate: (id: string, score: number, comment?: string) => void; onClearRating: (id: string) => void }> = ({ hostelId, userRating, onRate, onClearRating }) => {
    const [hoverRating, setHoverRating] = useState(0);
    const [selectedRating, setSelectedRating] = useState(0);
    const [comment, setComment] = useState('');
    const [showComment, setShowComment] = useState(false);

    const handleStarClick = (score: number) => {
        setSelectedRating(score);
        setShowComment(true);
    };

    const submitRating = () => {
        onRate(hostelId, selectedRating, comment);
        setComment('');
        setShowComment(false);
        setSelectedRating(0); // Reset local selection after submit
    }

    const cancelRating = () => {
        setShowComment(false);
        setSelectedRating(0);
        setComment('');
    }

    return (
        <div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Your Rating & Review</p>
            <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => handleStarClick(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            aria-label={`Rate ${star} stars`}
                            type="button"
                        >
                            <svg className={`h-8 w-8 cursor-pointer transition-colors ${(hoverRating || selectedRating || userRating || 0) >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </button>
                    ))}
                </div>

                {showComment && !userRating && (
                    <div className="space-y-2">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Write a review (optional)..."
                            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            rows={3}
                        />
                        <div className="flex gap-2">
                            <Button onClick={submitRating}>Submit Review</Button>
                            <Button variant="secondary" onClick={cancelRating}>Cancel</Button>
                        </div>
                    </div>
                )}

                {userRating && userRating > 0 && (
                    <Button variant="secondary" onClick={() => onClearRating(hostelId)}>Clear Rating</Button>
                )}
            </div>
        </div>
    );
};


const HostelDetail: React.FC<HostelDetailProps> = ({ hostel, user, owner, onBack, onEdit, onDelete, onToggleStatus, onRate, onClearRating, onMarkAsStayed, onMessageOwner, onBook }) => {
    // Defensive null checks
    const images = hostel?.images || [];
    const defaultImage = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&q=80';
    const [mainImage, setMainImage] = useState(images[0] || defaultImage);
    const [showReviewsModal, setShowReviewsModal] = useState(false);
    const toast = useToast();

    // Guard against undefined hostel
    if (!hostel) {
        return (
            <div className="max-w-5xl mx-auto p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">Loading hostel details...</p>
            </div>
        );
    }

    const isOwner = user.role === 'owner' && user.id === hostel.ownerId;
    const hasStayed = user.stayHistory?.includes(hostel.id) ?? false;
    const userRating = hostel.reviews?.find(r => r.userId === user.id)?.rating;

    // Masked contact state
    const [isContactRevealed, setIsContactRevealed] = useState(false);

    // Appointment scheduler state
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

    // Mask phone number helper
    const maskPhoneNumber = (phone: string | undefined) => {
        if (!phone) return 'Not provided';
        const lastFour = phone.slice(-4);
        return `●●●●● ${lastFour}`;
    };


    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setIsLightboxOpen(true);
    };

    const closeLightbox = () => setIsLightboxOpen(false);

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setLightboxIndex((prev) => (prev + 1) % (images.length || 1));
    };

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setLightboxIndex((prev) => (prev - 1 + (images.length || 1)) % (images.length || 1));
    };

    // Keyboard navigation for lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isLightboxOpen) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLightboxOpen]);

    return (
        <div className="max-w-5xl mx-auto">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Listings
            </button>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Image Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-4 cursor-pointer" onClick={() => openLightbox(images.indexOf(mainImage))}>
                        <img src={mainImage} alt={hostel.name} className="w-full h-96 object-cover rounded-lg hover:opacity-95 transition-opacity" />
                        <p className="text-center text-sm text-gray-500 mt-2">Click to view full screen</p>
                    </div>
                    <div className="p-4 grid grid-cols-4 gap-1 overflow-y-auto max-h-96 content-start">
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setMainImage(img)}
                                className={`relative block w-full aspect-square focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 ${mainImage === img ? 'ring-2 ring-blue-500' : ''}`}
                            >
                                <img src={img} alt={`${hostel.name} view ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Lightbox Overlay */}
                {isLightboxOpen && (
                    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4" onClick={closeLightbox}>
                        <button className="absolute top-4 right-4 text-white hover:text-gray-300 focus:outline-none" onClick={closeLightbox}>
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <button className="absolute left-4 text-white hover:text-gray-300 focus:outline-none hidden md:block" onClick={prevImage}>
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>

                        <img
                            src={images[lightboxIndex] || defaultImage}
                            alt={`Full screen view ${lightboxIndex + 1}`}
                            className="max-h-[90vh] max-w-[90vw] object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />

                        <button className="absolute right-4 text-white hover:text-gray-300 focus:outline-none hidden md:block" onClick={nextImage}>
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>

                        <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm">
                            {lightboxIndex + 1} / {images.length || 1}
                        </div>
                    </div>
                )}

                <div className="p-6 md:p-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between md:items-start mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{hostel.name}</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">{hostel.location}</p>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <div className="flex items-center gap-2 mb-1 justify-end">
                                <button
                                    onClick={() => setShowReviewsModal(true)}
                                    className="flex items-center bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                                    aria-label="View all reviews"
                                >
                                    <svg className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="font-bold text-gray-900 dark:text-white">{(hostel.rating || 0).toFixed(1)}</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">({hostel.reviews?.length || 0} reviews)</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">PKR {(hostel.price || 0).toLocaleString()}<span className="text-base font-normal text-gray-500 dark:text-gray-400">/month</span></p>
                                <FairnessBadge hostelId={hostel.id} price={hostel.price} />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{hostel.description}</p>

                    {/* Video Tour */}
                    {hostel.videos && hostel.videos.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-3">Video Tour</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {hostel.videos.map((video, index) => (
                                    <video key={index} src={video} controls className="w-full rounded-lg shadow-md" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 360 Tour */}
                    {hostel.tour360 && hostel.tour360.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-3">360° Views</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {hostel.tour360.map((img, index) => (
                                    <div key={index} className="relative">
                                        <img src={img} alt={`360 view ${index + 1}`} className="w-full rounded-lg shadow-md" />
                                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">360° View</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Amenities */}
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-3">Amenities</h2>
                        <div className="flex flex-wrap gap-3">
                            {hostel.amenities.map(amenity => (
                                <span key={amenity} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium px-3 py-1.5 rounded-full capitalize">{amenity}</span>
                            ))}
                        </div>
                    </div>

                    {/* Actions Section */}
                    <div className="border-t dark:border-gray-700 pt-6">
                        {!isOwner && (
                            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Owner Information & Your Stay</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {owner ? (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{owner.firstName} {owner.lastName}</p>
                                            </div>

                                            {/* Owner Trust Score - Prominent Display */}
                                            <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Owner Trust Score</p>
                                                <TrustBadge userId={owner.id} size="md" />
                                            </div>

                                            {/* Masked Contact Number */}
                                            <div className="mb-3">
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    Contact: {isContactRevealed ? owner.contactNumber : maskPhoneNumber(owner.contactNumber)}
                                                </p>
                                                {!isContactRevealed && owner.contactNumber && (
                                                    <button
                                                        onClick={() => setIsContactRevealed(true)}
                                                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1"
                                                    >
                                                        🔓 Reveal Contact Number
                                                    </button>
                                                )}
                                            </div>

                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {owner.contactNumber && isContactRevealed && (
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => {
                                                            window.location.href = `tel:${owner.contactNumber}`;
                                                        }}
                                                    >
                                                        📞 Call Owner
                                                    </Button>
                                                )}
                                                <Button
                                                    onClick={() => onMessageOwner(owner.id)}
                                                >
                                                    💬 Message Owner
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => setIsAppointmentModalOpen(true)}
                                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                                >
                                                    📅 Schedule Visit
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    onClick={() => onBook(hostel.id)}
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    ✓ Book Now
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-400">Owner contact information not available.</p>
                                    )}
                                    <div>
                                        {hasStayed ? (
                                            <StarRating hostelId={hostel.id} userRating={userRating} onRate={onRate} onClearRating={onClearRating} />
                                        ) : (
                                            <div>
                                                <p className="text-gray-600 dark:text-gray-300 mb-3">Rate this hostel after you've completed your stay.</p>
                                                <Button onClick={() => onMarkAsStayed(hostel.id)}>Mark as Stayed</Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {isOwner && (
                            <div className="space-y-3">
                                {/* Status indicator */}
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                                    <span className={`w-3 h-3 rounded-full ${hostel.status === 'Inactive' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Status: {hostel.status === 'Inactive' ? 'Inactive (Hidden from customers)' : 'Active'}
                                    </span>
                                </div>
                                <div className="flex gap-3">
                                    <Button onClick={() => onEdit(hostel)} fullWidth>Edit Listing</Button>
                                    {onToggleStatus && (
                                        <Button
                                            onClick={() => onToggleStatus(hostel.id, hostel.status === 'Inactive' ? 'Available' : 'Inactive')}
                                            className={hostel.status === 'Inactive'
                                                ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                                                : 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'}
                                            fullWidth
                                        >
                                            {hostel.status === 'Inactive' ? 'Activate' : 'Deactivate'}
                                        </Button>
                                    )}
                                    <Button onClick={() => onDelete(hostel.id)} className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500" fullWidth>Delete</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Appointment Scheduler Modal */}
            {isAppointmentModalOpen && owner && (
                <AppointmentScheduler
                    hostelId={hostel.id}
                    ownerId={owner.id}
                    hostelName={hostel.name}
                    onClose={() => setIsAppointmentModalOpen(false)}
                    onSuccess={() => {
                        toast.showSuccess('Appointment request sent! The owner will contact you soon.');
                    }}
                />
            )}

            {/* Reviews Modal */}
            {showReviewsModal && (
                <ReviewsModal
                    hostel={hostel}
                    onClose={() => setShowReviewsModal(false)}
                />
            )}
        </div>
    );
};

export default HostelDetail;