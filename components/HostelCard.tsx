import React from 'react';
import { Hostel } from '../types';

interface HostelCardProps {
  hostel: Hostel;
  onSelectHostel: (hostel: Hostel) => void;
}

const categoryStyles: { [key: string]: string } = {
  boys: 'bg-blue-100 text-blue-800',
  girls: 'bg-pink-100 text-pink-800',
  any: 'bg-gray-100 text-gray-800',
}

const placeholderImage = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop&q=80';


const HostelCard: React.FC<HostelCardProps> = ({ hostel, onSelectHostel }) => {
  const displayImage = hostel.images && hostel.images.length > 0 ? hostel.images[0] : placeholderImage;

  const averageRating = hostel.ratings && hostel.ratings.length > 0
    ? hostel.ratings.reduce((acc, r) => acc + r.score, 0) / hostel.ratings.length
    : hostel.rating;

  return (
    <button
      onClick={() => onSelectHostel(hostel)}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col justify-between transform hover:-translate-y-1 transition-transform duration-300 border border-gray-100 dark:border-gray-700 text-left w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-60"
    >
      <div>
        <div className="relative">
          <img src={displayImage} alt={hostel.name} className="w-full h-48 object-cover" />
          <span className={`absolute top-2 right-2 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${categoryStyles[hostel.category] || categoryStyles.any}`}>
            For {hostel.category}
          </span>
        </div>
        <div className="p-5">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white truncate pr-2">{hostel.name}</h3>
            {hostel.verified && (
              <div className="flex-shrink-0 flex items-center gap-1 bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </div>
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{hostel.location}</p>

          {hostel.description && (
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-3 line-clamp-2">{hostel.description}</p>
          )}

          <div className="flex justify-between items-center mt-4">
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">PKR {hostel.price.toLocaleString()}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/month</span></p>
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300 font-semibold">{averageRating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-5 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Amenities</p>
        <div className="flex flex-wrap gap-2">
          {hostel.amenities.slice(0, 3).map(amenity => (
            <span key={amenity} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full capitalize">{amenity}</span>
          ))}
          {hostel.amenities.length > 3 && <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full">+{hostel.amenities.length - 3} more</span>}
        </div>
      </div>
    </button>
  );
};

export default HostelCard;
