import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { User, Hostel } from './types';
import Login from './components/Login';
import AccountTypeSelector from './components/AccountTypeSelector';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import HostelList from './components/HostelList';
import Modal from './components/Modal';
import PropertyListingForm from './components/PropertyListingForm';
import { PlusIcon } from './components/icons/PlusIcon';
import Profile from './components/Profile';
import HostelDetail from './components/HostelDetail';
import { MenuIcon } from './components/icons/MenuIcon';
import Settings from './components/Settings';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { api } from './services/mongoService';
import { useSocket } from './contexts/SocketContext';

// New Module Imports
import ChatDashboard from './components/ChatDashboard';
import RoommateMatchList from './components/RoommateMatchList';
import AgreementDashboard from './components/AgreementDashboard';
import AdminLayout from './components/admin/AdminLayout';
import OAuthCallback from './components/OAuthCallback';
import FairRentEstimator from './components/FairRentEstimator';
import BookingVerificationDashboard from './components/BookingVerificationDashboard';
import BookingHistory from './components/BookingHistory';
import AppointmentDashboard from './components/AppointmentDashboard';
import SmartSearch from './components/SmartSearch';
import FraudDashboard from './components/FraudDashboard';
import BookingForm from './components/BookingForm';

// Module 3: AI-Based Search Components
import SearchFilters from './components/SearchFilters';
import HostelMap from './components/HostelMap';
import AIRecommendations from './components/AIRecommendations';

const getRandomImages = (count = 3) => {
  const placeholderImages = [
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1596276020587-8044fe56ceca?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1520277439717-9164d0987285?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1623625434462-e5e42318ae49?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1512918760513-95f6929c3cc3?auto=format&fit=crop&w=800&q=80'
  ];
  const shuffled = [...placeholderImages].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, placeholderImages.length));
};


const App: React.FC = () => {
  // Check for OAuth callback route
  if (window.location.pathname === '/oauth/callback') {
    return <OAuthCallback />;
  }

  const { connect, disconnect } = useSocket();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingHostel, setEditingHostel] = useState<Hostel | null>(null);

  const [currentView, setCurrentView] = useState<'dashboard' | 'profile' | 'settings' | 'chat' | 'roommate-matching' | 'agreements' | 'admin' | 'rent-estimator' | 'booking-history' | 'appointments'>('dashboard');
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [selectedHostelOwner, setSelectedHostelOwner] = useState<User | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingHostel, setBookingHostel] = useState<Hostel | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sortOption, setSortOption] = useState('default');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showFilters, setShowFilters] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<Record<string, any> | null>(null);
  const [searchBarKey, setSearchBarKey] = useState(Date.now());
  const [initialConversationId, setInitialConversationId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const unsubscribe = api.auth.onAuthStateChanged(async (mockUser) => {
      if (mockUser) {
        const userProfile = await api.db.getUser(mockUser.id);
        if (userProfile) {
          setUser(userProfile);
        } else {
          // Fallback if profile doesn't exist yet but auth does
          console.log("User auth found, but no profile yet.");
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || currentView !== 'dashboard') {
      setHostels([]);
      return;
    }

    const unsubscribe = api.db.subscribeToHostels((data) => {
      setHostels(data);
    });

    return () => unsubscribe();
  }, [user, currentView]);

  useEffect(() => {
    const fetchOwner = async () => {
      if (selectedHostel && selectedHostel.ownerId) {
        const owner = await api.db.getUser(selectedHostel.ownerId);
        setSelectedHostelOwner(owner);
      } else {
        setSelectedHostelOwner(null);
      }
    };

    fetchOwner();
  }, [selectedHostel]);


  const handleSignUp = async (uid: string, userData: Omit<User, 'id' | 'role'>) => {
    // This function is called after successful Mock Auth signup
    const newUser: User = { id: uid, ...userData, role: 'pending', stayHistory: [] };
    const savedUser = await api.db.setUser(uid, newUser);
    setUser(savedUser);
  };

  const handleRoleSelect = async (role: 'owner' | 'customer') => {
    if (user && user.role === 'pending') {
      const updatedUser = { ...user, role };
      await api.db.setUser(user.id, updatedUser);
      setUser(updatedUser);
    }
  };

  const handleMessageOwner = async (ownerId: string) => {
    try {
      setIsLoading(true);
      // Check if conversation exists or create new one
      const conversations = await api.conversations.getAll();
      let conversation = conversations.find((c: any) =>
        c.participants.some((p: any) => p._id === ownerId || p.id === ownerId)
      );

      if (!conversation) {
        conversation = await api.conversations.create(ownerId);
      }

      setInitialConversationId(conversation._id || conversation.id);
      setCurrentView('chat');
      setSelectedHostel(null);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      alert('Failed to start conversation with owner');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    api.auth.signOut();
    setCurrentView('dashboard');
    setSelectedHostel(null);
    setIsMenuOpen(false);
  };

  const handleNavigate = (view: 'dashboard' | 'profile' | 'settings' | 'chat' | 'roommate-matching' | 'agreements' | 'admin' | 'rent-estimator' | 'booking-history') => {
    setSelectedHostel(null);
    setCurrentView(view);
    setIsMenuOpen(false);
  };

  const handleSwitchRole = async () => {
    if (!user) return;
    const newRole = user.role === 'owner' ? 'customer' : 'owner';
    await api.db.setUser(user.id, { role: newRole });
    // User state update handles via auth subscription, but for immediate UI feedback:
    setUser(prev => prev ? { ...prev, role: newRole } : null);
    setCurrentView('profile');
  };

  const handleSearch = (query: string, filters: Record<string, any> = {}) => {
    setSortOption('default');
    setSearchQuery(query);
    setSearchFilters(filters);
  };

  const handleApplyFilters = (filterState: any) => {
    // Convert FilterState to the format expected by handleSearch
    const filters: Record<string, any> = {};

    if (filterState.priceRange) {
      filters.minPrice = filterState.priceRange[0];
      filters.maxPrice = filterState.priceRange[1];
    }
    if (filterState.amenities?.length > 0) {
      filters.amenities = filterState.amenities.join(',');
    }
    if (filterState.roomCategories?.length > 0) {
      filters.roomCategories = filterState.roomCategories.join(',');
    }
    if (filterState.genderPreference && filterState.genderPreference !== 'any') {
      filters.genderPreference = filterState.genderPreference;
    }
    if (filterState.minRating > 0) {
      filters.minRating = filterState.minRating;
    }
    if (filterState.verifiedOnly) {
      filters.verifiedOnly = true;
    }

    handleSearch(searchQuery, filters);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchFilters(null);
    setSortOption('default');
    setSearchBarKey(Date.now());
  };

  const handleOpenAddModal = () => {
    setEditingHostel(null);
    setIsModalOpen(true);
  };

  const handleLogin = (userData: User) => {
    console.log('App: handleLogin called with', userData);
    setUser(userData);
    setIsModalOpen(false);
  };

  const handleOpenEditModal = (hostel: Hostel) => {
    setEditingHostel(hostel);
    setIsModalOpen(true);
  };

  const handleSaveHostel = async (hostelData: Omit<Hostel, 'id'> & { id?: string }) => {
    try {
      if (editingHostel && hostelData.id) {
        const updatedHostel = await api.db.updateHostel(hostelData as Hostel);

        // Update hostels list
        setHostels(prev => prev.map(h => h.id === updatedHostel.id ? updatedHostel : h));

        if (selectedHostel && selectedHostel.id === updatedHostel.id) {
          setSelectedHostel(updatedHostel);
        }
      } else if (user) {
        const newHostel = {
          ...hostelData,
          ownerId: user.id,
          ratings: [],
          images: hostelData.images?.length > 0 ? hostelData.images : getRandomImages()
        };
        const savedHostel = await api.db.addHostel(newHostel);

        // Update hostels list
        setHostels(prev => [...prev, savedHostel]);
      }
      setIsModalOpen(false);
      setEditingHostel(null);
    } catch (error) {
      console.error('Failed to save hostel:', error);
      alert('Failed to save hostel. Please try again.');
    }
  };

  const handleDeleteHostel = async (hostelId: string) => {
    if (window.confirm('Are you sure you want to delete this hostel listing?')) {
      await api.db.deleteHostel(hostelId);
      setSelectedHostel(null);
    }
  };

  const handleRateHostel = async (hostelId: string, score: number, comment?: string) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

      const response = await fetch(`${apiUrl}/api/hostels/${hostelId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating: score, comment })
      });

      if (response.ok) {
        const updatedHostel = await response.json();

        // Update hostels list
        setHostels(prev => prev.map(h => h.id === hostelId ? { ...h, ...updatedHostel, id: h.id } : h));

        // Update selected hostel if viewing it
        if (selectedHostel && selectedHostel.id === hostelId) {
          setSelectedHostel({ ...selectedHostel, ...updatedHostel, id: selectedHostel.id });
        }
        alert('Review submitted successfully!');
      } else {
        const errorData = await response.json();
        console.error('Failed to submit review:', errorData);
        alert(`Failed to submit review: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      alert(`Error submitting review: ${error.message || 'Check your connection'}`);
    }
  };

  const handleClearRating = async (hostelId: string) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

      const response = await fetch(`${apiUrl}/api/hostels/${hostelId}/reviews`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const updatedHostel = await response.json();

        // Update hostels list
        setHostels(prev => prev.map(h => h.id === hostelId ? { ...h, ...updatedHostel, id: h.id } : h));

        // Update selected hostel if viewing it
        if (selectedHostel && selectedHostel.id === hostelId) {
          setSelectedHostel({ ...selectedHostel, ...updatedHostel, id: selectedHostel.id });
        }
      } else {
        console.error('Failed to clear review');
        alert('Failed to delete review. Please try again.');
      }
    } catch (error) {
      console.error('Error clearing review:', error);
      alert('Error deleting review. Please check your connection.');
    }
  };

  const handleMarkAsStayed = async (hostelId: string) => {
    if (!user) return;
    const currentHistory = user.stayHistory || [];
    if (!currentHistory.includes(hostelId)) {
      const newHistory = [...currentHistory, hostelId];
      await api.db.setUser(user.id, { stayHistory: newHistory });
      setUser(prev => prev ? { ...prev, stayHistory: newHistory } : null);
    }
  };

  const handleUpdateUser = async (updatedData: Partial<User> | FormData) => {
    if (!user) return;
    try {
      const updatedUser = await api.db.setUser(user.id, updatedData);
      setUser(updatedUser);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile.');
    }
  };

  const filteredHostels = useMemo(() => {
    if (!searchQuery && !searchFilters) {
      return hostels;
    }
    return hostels.filter(hostel => {
      let textMatch = true;
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        const nameMatch = hostel.name.toLowerCase().includes(queryLower);
        const locationMatch = hostel.location.toLowerCase().includes(queryLower);
        const descriptionMatch = hostel.description?.toLowerCase().includes(queryLower) || false;
        textMatch = nameMatch || locationMatch || descriptionMatch;
      }

      let filterMatch = true;
      if (searchFilters) {
        const priceMatch = hostel.price >= searchFilters.priceRange[0] && (searchFilters.priceRange[1] === 30000 || hostel.price <= searchFilters.priceRange[1]);
        const amenitiesMatch = searchFilters.amenities.every((amenity: string) => hostel.amenities.includes(amenity));
        filterMatch = priceMatch && amenitiesMatch;
      }

      return textMatch && filterMatch;
    });
  }, [hostels, searchQuery, searchFilters]);

  const sortedHostels = useMemo(() => {
    if (sortOption === 'default') {
      return filteredHostels;
    }
    const hostelsToSort = [...filteredHostels];
    switch (sortOption) {
      case 'price-asc':
        hostelsToSort.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        hostelsToSort.sort((a, b) => b.price - a.price);
        break;
      case 'rating-desc':
        hostelsToSort.sort((a, b) => b.rating - a.rating);
        break;
      case 'name-asc':
        hostelsToSort.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    return hostelsToSort;
  }, [filteredHostels, sortOption]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SpinnerIcon />
      </div>
    );
  }

  if (!user) {
    return <Login onSignUpSubmit={handleSignUp} />;
  }

  if (user.role === 'pending') {
    return <AccountTypeSelector onSelectRole={handleRoleSelect} username={user.username} />
  }

  const isSearchActive = !!(searchQuery || searchFilters);

  const renderDashboard = () => (
    <>
      {/* Search Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 mb-8 border border-gray-100 dark:border-gray-700 transition-colors">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
          🔍 Find Your Perfect Hostel
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-6">
          AI-powered search to help you discover the best hostels
        </p>

        {/* Search Box with integrated AI button */}
        <div className="relative">
          <div className="relative">
            <SearchBar key={searchBarKey} onSearch={handleSearch} />
            {/* AI Button inside search box */}
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-md z-10"
              onClick={() => {/* AI search handler */ }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              AI
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <SearchFilters
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearSearch}
            />
          </div>
        )}
      </div>

      {/* AI Recommendations Section */}
      <div className="mb-8">
        <AIRecommendations onHostelClick={setSelectedHostel} />
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200">
            Hostel Listings
          </h2>
          {isSearchActive && (
            <button
              onClick={handleClearSearch}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
            >
              Clear Search
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex gap-2 bg-gray-700 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'list'
                ? 'bg-gray-600 dark:bg-gray-600 text-white shadow-sm'
                : 'text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-white'
                }`}
            >
              📋 List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'map'
                ? 'bg-gray-600 dark:bg-gray-600 text-white shadow-sm'
                : 'text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-white'
                }`}
            >
              🗺️ Map
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-hostels" className="text-sm font-medium text-gray-700 dark:text-gray-300 sr-only sm:not-sr-only">
              Sort by:
            </label>
            <select
              id="sort-hostels"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full sm:w-auto p-2"
              aria-label="Sort hostels"
            >
              <option value="default">Recommended</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Rating: High to Low</option>
              <option value="name-asc">Name: A-Z</option>
            </select>
          </div>
        </div>

        {user.role === 'owner' && (
          <button
            onClick={handleOpenAddModal}
            className="flex-shrink-0 flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <PlusIcon />
            Add Hostel
          </button>
        )}
      </div>

      {/* Results Area */}
      {viewMode === 'list' ? (
        <HostelList hostels={sortedHostels} onSelectHostel={setSelectedHostel} />
      ) : (
        <div className="h-[600px] rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
          <HostelMap
            hostels={sortedHostels}
            onHostelClick={setSelectedHostel}
            center={[33.6844, 73.0479]}
            zoom={12}
          />
        </div>
      )}
    </>
  );

  const handleBookHostel = (hostelId: string) => {
    const hostel = hostels.find(h => h.id === hostelId);
    if (hostel) {
      setBookingHostel(hostel);
      setIsBookingModalOpen(true);
    }
  };

  const handleBookingSubmit = async (bookingData: any) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

      const response = await fetch(`${apiUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const newBooking = await response.json();
      setIsBookingModalOpen(false);
      setBookingHostel(null);
      alert('Booking request sent successfully! Please wait for owner approval.');
      return newBooking;
    } catch (error: any) {
      console.error('Booking error:', error);
      alert(`Booking failed: ${error.message}`);
      throw error;
    }
  };

  const getPageTitle = () => {
    if (selectedHostel) return selectedHostel.name;
    if (currentView === 'profile') return 'My Profile';
    if (currentView === 'settings') return 'Settings';
    if (currentView === 'chat') return 'Messages';
    if (currentView === 'roommate-matching') return 'Roommate Matching';
    if (currentView === 'agreements') return 'Agreements';
    if (currentView === 'admin') return 'Admin Dashboard';
    if (currentView === 'rent-estimator') return 'Fair Rent Estimator';
    if (currentView === 'booking-history') return 'My Bookings';
    return 'Dashboard';
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'profile':
        return <Profile user={user} allHostels={hostels} onSwitchRole={handleSwitchRole} onUpdateUser={handleUpdateUser} />;
      case 'settings':
        return <Settings user={user} onUpdateUser={handleUpdateUser} theme={theme} toggleTheme={toggleTheme} />;
      case 'chat':
        return <ChatDashboard currentUser={user} initialConversationId={initialConversationId} />;
      case 'roommate-matching':
        return <RoommateMatchList />;
      case 'agreements':
        return <AgreementDashboard user={user} />;
      case 'admin':
        return <AdminLayout />;
      case 'rent-estimator':
        return <FairRentEstimator onClose={() => setCurrentView('dashboard')} />;
      case 'booking-history':
        return <BookingHistory />;
      case 'appointments':
        return <AppointmentDashboard userRole={user.role as 'owner' | 'customer'} userId={user.id} />;
      case 'dashboard':
      default:
        if (selectedHostel) {
          return (
            <HostelDetail
              hostel={selectedHostel}
              user={user}
              owner={selectedHostelOwner || undefined}
              onBack={() => setSelectedHostel(null)}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteHostel}
              onRate={handleRateHostel}
              onClearRating={handleClearRating}
              onMarkAsStayed={handleMarkAsStayed}
              onMessageOwner={handleMessageOwner}
              onBook={handleBookHostel}
            />
          );
        }
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      {isMenuOpen && <Sidebar user={user} onLogout={handleLogout} onNavigate={handleNavigate} onClose={() => setIsMenuOpen(false)} />}

      <main className="p-4 md:p-8">
        <header className="relative flex items-center justify-between mb-8 h-16">
          {/* Left: Menu + Page Title */}
          <div className="flex items-center gap-4 z-10">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
              aria-label="Open menu"
            >
              <MenuIcon />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white truncate max-w-[150px] sm:max-w-xs">{getPageTitle()}</h1>
          </div>

          {/* Center: Logo + App Name */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 sm:gap-3">
            <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-white whitespace-nowrap">Hostel Hub</span>
          </div>

          {/* Right: Placeholder for balance */}
          <div className="w-10"></div>
        </header>

        {renderCurrentView()}
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <PropertyListingForm
          onSubmit={handleSaveHostel}
          onCancel={() => setIsModalOpen(false)}
          initialData={editingHostel}
        />
      </Modal>

      {isBookingModalOpen && bookingHostel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <BookingForm
              hostel={bookingHostel}
              onSubmit={handleBookingSubmit}
              onClose={() => setIsBookingModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App; 