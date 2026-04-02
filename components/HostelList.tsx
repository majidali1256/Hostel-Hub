import React, { useState, useEffect } from 'react';
import { Hostel } from '../types';
import HostelCard from './HostelCard';

interface HostelListProps {
  hostels: Hostel[];
  onSelectHostel: (hostel: Hostel) => void;
}

const ITEMS_PER_PAGE = 9;

const HostelList: React.FC<HostelListProps> = ({ hostels, onSelectHostel }) => {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Reset visible count when hostels search/filter results change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [hostels]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  if (hostels.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 animate-fade-in-up">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">No Hostels Found</h3>
          <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or adding a new hostel!</p>
        </div>
      </div>
    )
  }

  const visibleHostels = hostels.slice(0, visibleCount);
  const hasMore = visibleCount < hostels.length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {visibleHostels.map((hostel, index) => (
          <div
            key={hostel.id}
            className="animate-stagger-in"
            style={{ animationDelay: `${Math.min(index * 0.06, 0.5)}s` }}
          >
            <HostelCard hostel={hostel} onSelectHostel={onSelectHostel} />
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4 animate-fade-in">
          <button
            onClick={handleLoadMore}
            className="px-8 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            Load More ({hostels.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
};

export default HostelList;
