import { User, Hostel } from '../types';

const STORAGE_KEYS = {
    USERS: 'hh_users',
    HOSTELS: 'hh_hostels',
    CURRENT_USER: 'hh_current_user'
};

const MOCK_DELAY = 600;

const initialHostels: Hostel[] = [
    { 
        id: 'h1', 
        ownerId: 'mock-uid-owner-1', 
        name: 'Student Comfort Inn', 
        location: 'Islamabad G-10', 
        price: 15000, 
        description: 'A quiet and clean hostel perfect for students who need a peaceful environment to study. Close to the main market.', 
        amenities: ['wifi', 'laundry', 'mess'], 
        rating: 4.5, 
        ratings: [], 
        verified: true, 
        images: [
            'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80'
        ], 
        category: 'boys' 
    },
    { 
        id: 'h2', 
        ownerId: 'mock-uid-owner-1', 
        name: 'Capital Boys Hostel', 
        location: 'Islamabad I-8', 
        price: 18000, 
        description: 'Modern facilities with a vibrant community. Ideal for young professionals and students looking to network.', 
        amenities: ['wifi', 'air-conditioning', 'mess'], 
        rating: 4.2, 
        ratings: [], 
        verified: true, 
        images: [
            'https://images.unsplash.com/photo-1596276020587-8044fe56ceca?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1520277439717-9164d0987285?auto=format&fit=crop&w=800&q=80'
        ], 
        category: 'boys' 
    },
    { 
        id: 'h3', 
        ownerId: 'mock-uid-owner-2', 
        name: 'SZABIST Girls Dorms', 
        location: 'Islamabad H-8/4', 
        price: 20000, 
        description: 'Secure and well-maintained dorms with a focus on safety and comfort for female students. Walking distance to the university.', 
        amenities: ['wifi', 'laundry', 'security'], 
        rating: 4.8, 
        ratings: [], 
        verified: false, 
        images: [
            'https://images.unsplash.com/photo-1523908511403-7fc7b25592f4?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1616593969747-4797d757942c?auto=format&fit=crop&w=800&q=80'
        ], 
        category: 'girls' 
    },
];

// Helpers
const getStored = <T>(key: string, defaultVal: T): T => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultVal;
    } catch {
        return defaultVal;
    }
};

const setStored = (key: string, val: any) => localStorage.setItem(key, JSON.stringify(val));

// Initialize data
if (!localStorage.getItem(STORAGE_KEYS.HOSTELS)) {
    setStored(STORAGE_KEYS.HOSTELS, initialHostels);
}

// Event System
const listeners: { [key: string]: Function[] } = { auth: [], hostels: [] };
const notify = (event: string, data: any) => listeners[event]?.forEach(cb => cb(data));

export const mockAuth = {
    onAuthStateChanged: (callback: (user: User | null) => void) => {
        listeners.auth.push(callback);
        const currentUser = getStored<User | null>(STORAGE_KEYS.CURRENT_USER, null);
        // Simulate async initialization
        setTimeout(() => callback(currentUser), MOCK_DELAY);
        return () => { listeners.auth = listeners.auth.filter(cb => cb !== callback); };
    },
    signIn: async (email: string, password?: string) => {
        await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
        const users = getStored<User[]>(STORAGE_KEYS.USERS, []);
        const user = users.find(u => u.email === email);
        
        if (user) {
             setStored(STORAGE_KEYS.CURRENT_USER, user);
             notify('auth', user);
             return user;
        }
        
        throw new Error("User not found. Please sign up.");
    },
    signInWithProvider: async (provider: 'google' | 'facebook' | 'apple') => {
        await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
        
        const providerDomain = provider === 'google' ? 'gmail.com' : `${provider}.com`;
        const email = `demo.user@${providerDomain}`;
        
        const users = getStored<User[]>(STORAGE_KEYS.USERS, []);
        let user = users.find(u => u.email === email);

        if (!user) {
            // Create a new user automatically for social login
            const capitalizedProvider = provider.charAt(0).toUpperCase() + provider.slice(1);
            const uid = `user-${provider}-${Date.now()}`;
            
            user = {
                id: uid,
                email: email,
                username: `${capitalizedProvider}User`,
                firstName: 'Demo',
                lastName: capitalizedProvider,
                role: 'pending', // Default to pending so they see the role selector
                contactNumber: '0300-0000000',
                stayHistory: [],
                profilePicture: `https://ui-avatars.com/api/?name=${capitalizedProvider}+User&background=random&color=fff`
            };
            
            users.push(user);
            setStored(STORAGE_KEYS.USERS, users);
        }
        
        setStored(STORAGE_KEYS.CURRENT_USER, user);
        notify('auth', user);
        return user;
    },
    signUp: async (email: string, password?: string) => {
         await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
         // Just return a stub, the actual profile creation happens in App.tsx handleSignUp
         return { uid: 'user-' + Date.now(), email };
    },
    signOut: async () => {
        await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        notify('auth', null);
    }
};

export const mockDB = {
    subscribeToHostels: (callback: (hostels: Hostel[]) => void) => {
        listeners.hostels.push(callback);
        const hostels = getStored<Hostel[]>(STORAGE_KEYS.HOSTELS, []);
        setTimeout(() => callback(hostels), 100);
        return () => { listeners.hostels = listeners.hostels.filter(cb => cb !== callback); };
    },
    getUser: async (uid: string) => {
        const users = getStored<User[]>(STORAGE_KEYS.USERS, []);
        return users.find(u => u.id === uid) || null;
    },
    setUser: async (uid: string, data: any) => {
        const users = getStored<User[]>(STORAGE_KEYS.USERS, []);
        const index = users.findIndex(u => u.id === uid);
        const newUser = { id: uid, ...data };
        
        if (index >= 0) {
            users[index] = { ...users[index], ...data };
        } else {
            users.push(newUser);
        }
        setStored(STORAGE_KEYS.USERS, users);
        
        // Update session if it's the current user
        const currentUser = getStored<User | null>(STORAGE_KEYS.CURRENT_USER, null);
        if (currentUser && currentUser.id === uid) {
            const updated = { ...currentUser, ...data };
            setStored(STORAGE_KEYS.CURRENT_USER, updated);
            notify('auth', updated);
        }
    },
    addHostel: async (hostel: Omit<Hostel, 'id'>) => {
        const hostels = getStored<Hostel[]>(STORAGE_KEYS.HOSTELS, []);
        const newHostel = { ...hostel, id: 'h-' + Date.now() };
        const updated = [newHostel, ...hostels];
        setStored(STORAGE_KEYS.HOSTELS, updated);
        notify('hostels', updated);
    },
    updateHostel: async (hostel: Partial<Hostel> & { id: string }) => {
        const hostels = getStored<Hostel[]>(STORAGE_KEYS.HOSTELS, []);
        const index = hostels.findIndex(h => h.id === hostel.id);
        if (index !== -1) {
            hostels[index] = { ...hostels[index], ...hostel };
            setStored(STORAGE_KEYS.HOSTELS, hostels);
            notify('hostels', hostels);
        }
    },
    deleteHostel: async (id: string) => {
        const hostels = getStored<Hostel[]>(STORAGE_KEYS.HOSTELS, []);
        const updated = hostels.filter(h => h.id !== id);
        setStored(STORAGE_KEYS.HOSTELS, updated);
        notify('hostels', updated);
    }
};