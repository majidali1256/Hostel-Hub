import React from 'react';
import { Hostel } from '../types';
import HostelCard from './HostelCard';

interface HostelListProps {
  hostels: Hostel[];
  onSelectHostel: (hostel: Hostel) => void;
}

const HostelList: React.FC<HostelListProps> = ({ hostels, onSelectHostel }) => {
  if (hostels.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-100 rounded-lg">
        <h3 className="text-xl font-semibold text-gray-700">No Hostels Found</h3>
        <p className="text-gray-500 mt-2">Try adjusting your search or adding a new hostel!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {hostels.map(hostel => (
        <HostelCard key={hostel.id} hostel={hostel} onSelectHostel={onSelectHostel} />
      ))}
    </div>
  );
};

export default HostelList;
