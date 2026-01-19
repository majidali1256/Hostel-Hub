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
      <div className="text-center py-20 bg-gray-100 rounded-lg">
        <h3 className="text-xl font-semibold text-gray-700">No Hostels Found</h3>
        <p className="text-gray-500 mt-2">Try adjusting your search or adding a new hostel!</p>
      </div>
    )
  }

  const visibleHostels = hostels.slice(0, visibleCount);
  const hasMore = visibleCount < hostels.length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {visibleHostels.map(hostel => (
          <HostelCard key={hostel.id} hostel={hostel} onSelectHostel={onSelectHostel} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            Load More Hostels ({hostels.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
};

export default HostelList;
