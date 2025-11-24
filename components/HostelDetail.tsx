import React, { useState } from 'react';
import { Hostel, User } from '../types';
import Button from './Button';

interface HostelDetailProps {
    hostel: Hostel;
    user: User;
    owner?: User;
    onBack: () => void;
    onEdit: (hostel: Hostel) => void;
    onDelete: (hostelId: string) => void;
    onRate: (hostelId: string, score: number) => void;
    onClearRating: (hostelId: string) => void;
    onMarkAsStayed: (hostelId: string) => void;
    onMessageOwner: (ownerId: string) => void;
}

const StarRating: React.FC<{ hostelId: string; userRating?: number; onRate: (id: string, score: number) => void; onClearRating: (id: string) => void }> = ({ hostelId, userRating, onRate, onClearRating }) => {
    const [hoverRating, setHoverRating] = useState(0);
    return (
        <div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Your Rating</p>
            <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => onRate(hostelId, star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            aria-label={`Rate ${star} stars`}
                        >
                            <svg className={`h-8 w-8 cursor-pointer transition-colors ${(hoverRating || userRating || 0) >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </button>
                    ))}
                </div>
                {userRating && userRating > 0 && (
                    <Button variant="secondary" onClick={() => onClearRating(hostelId)}>Clear Rating</Button>
                )}
            </div>
        </div>
    );
};


const HostelDetail: React.FC<HostelDetailProps> = ({ hostel, user, owner, onBack, onEdit, onDelete, onRate, onClearRating, onMarkAsStayed, onMessageOwner }) => {
    const [mainImage, setMainImage] = useState(hostel.images[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&q=80');

    const isOwner = user.role === 'owner' && user.id === hostel.ownerId;
    const hasStayed = user.stayHistory?.includes(hostel.id) ?? false;
    const userRating = hostel.ratings?.find(r => r.userId === user.id)?.score;

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
                    <div className="p-4">
                        <img src={mainImage} alt={hostel.name} className="w-full h-96 object-cover rounded-lg" />
                    </div>
                    <div className="p-4 grid grid-cols-3 gap-2 overflow-y-auto max-h-96">
                        {hostel.images.map((img, idx) => (
                            <button key={idx} onClick={() => setMainImage(img)} className={`focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md ${mainImage === img ? 'ring-2 ring-blue-500' : ''}`}>
                                <img src={img} alt={`${hostel.name} view ${idx + 1}`} className="w-full h-28 object-cover rounded-md" />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between md:items-start mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{hostel.name}</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">{hostel.location}</p>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">PKR {hostel.price.toLocaleString()}<span className="text-base font-normal text-gray-500 dark:text-gray-400">/month</span></p>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{hostel.description}</p>

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
                        {user.role === 'customer' && (
                            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Owner Information & Your Stay</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {owner ? (
                                        <div>
                                            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{owner.firstName} {owner.lastName}</p>
                                            <p className="text-gray-500 dark:text-gray-400">Contact: {owner.contactNumber}</p>
                                            <div className="mt-3 flex gap-2">
                                                {owner.contactNumber && (
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => {
                                                            window.location.href = `tel:${owner.contactNumber}`;
                                                        }}
                                                    >
                                                        Call Owner
                                                    </Button>
                                                )}
                                                <Button
                                                    onClick={() => onMessageOwner(owner.id)}
                                                >
                                                    Message Owner
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
                            <div className="flex gap-4">
                                <Button onClick={() => onEdit(hostel)} fullWidth>Edit Listing</Button>
                                <Button onClick={() => onDelete(hostel.id)} className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500" fullWidth>Delete Listing</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HostelDetail;