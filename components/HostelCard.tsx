import React, { useState } from 'react';
import { Hostel } from '../types';

interface HostelCardProps {
  hostel: Hostel;
  onSelectHostel: (hostel: Hostel) => void;
}

const categoryStyles: { [key: string]: string } = {
  boys: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
  girls: 'bg-pink-100 dark:bg-pink-900/50 text-pink-800 dark:text-pink-200',
  any: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
}

const placeholderImage = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop&q=80';


const HostelCard: React.FC<HostelCardProps> = React.memo(({ hostel, onSelectHostel }) => {
  const displayImage = hostel.images && hostel.images.length > 0 ? hostel.images[0] : placeholderImage;
  const [imageLoaded, setImageLoaded] = useState(false);

  const averageRating = hostel.rating || 0;

  return (
    <button
      onClick={() => onSelectHostel(hostel)}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-300 ease-out border border-gray-100 dark:border-gray-700 text-left w-full focus:outline-none focus:ring-2 focus:ring-blue-500/60 hover:-translate-y-1.5 active:scale-[0.98] group"
    >
      <div>
        <div className="relative overflow-hidden">
          {/* Shimmer loading placeholder */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-shimmer bg-[length:200%_100%]" />
          )}
          <img
            src={displayImage}
            alt={hostel.name}
            className={`w-full h-48 object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
          />
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full capitalize backdrop-blur-sm ${categoryStyles[hostel.category] || categoryStyles.any}`}>
            For {hostel.category}
          </span>
        </div>
        <div className="p-5">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white truncate pr-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">{hostel.name}</h3>
            {hostel.verified && (
              <div className="flex-shrink-0 flex items-center gap-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </div>
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {hostel.location}
          </p>

          {hostel.description && (
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-3 line-clamp-2">{hostel.description}</p>
          )}

          <div className="flex justify-between items-center mt-4">
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">PKR {hostel.price.toLocaleString()}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/month</span></p>
            <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300 font-semibold text-sm">{averageRating.toFixed(1)}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">({hostel.reviews?.length || 0})</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-5 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Amenities</p>
        <div className="flex flex-wrap gap-2">
          {hostel.amenities.slice(0, 3).map(amenity => (
            <span key={amenity} className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full capitalize border border-gray-100 dark:border-gray-600 shadow-sm">{amenity}</span>
          ))}
          {hostel.amenities.length > 3 && <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">+{hostel.amenities.length - 3} more</span>}
        </div>
      </div>
    </button>
  );
});

export default HostelCard;
