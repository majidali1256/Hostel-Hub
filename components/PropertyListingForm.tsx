
import React, { useState, useEffect } from 'react';
import { Hostel, HostelCategory } from '../types';
import Input from './Input';
import Button from './Button';

interface PropertyListingFormProps {
    onSubmit: (hostel: Omit<Hostel, 'id'> & { id?: string }) => void;
    onCancel: () => void;
    initialData?: Hostel | null;
}

const MAX_IMAGES = 10;

const PropertyListingForm: React.FC<PropertyListingFormProps> = ({ onSubmit, onCancel, initialData }) => {
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [amenities, setAmenities] = useState('');
    // Rating state is no longer managed by user input for new hostels
    const [roomCategory, setRoomCategory] = useState('Shared Room');
    const [genderPreference, setGenderPreference] = useState<HostelCategory>('any');
    const [verified, setVerified] = useState(false);
    const [images, setImages] = useState<string[]>([]);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setLocation(initialData.location);
            setDescription(initialData.description || '');
            setPrice(String(initialData.price));
            setAmenities(initialData.amenities.join(', '));
            setRoomCategory(initialData.category || 'Shared Room');
            setGenderPreference((initialData as any).genderPreference || 'any');
            setVerified(initialData.verified);
            setImages(initialData.images || []);
        } else {
            // Reset form for 'Add New'
            setName('');
            setLocation('');
            setDescription('');
            setPrice('');
            setAmenities('');
            setRoomCategory('Shared Room');
            setGenderPreference('any');
            setVerified(false);
            setImages([]);
        }
    }, [initialData]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const remainingSlots = MAX_IMAGES - images.length;
            const filesToProcess = files.slice(0, remainingSlots);

            if (files.length > remainingSlots) {
                alert(`You can only upload ${remainingSlots} more images. The first ${remainingSlots} files were selected.`);
            }

            filesToProcess.forEach((file: File) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImages(prevImages => [...prevImages, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
    }


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !location || !price) return;

        onSubmit({
            id: initialData?.id,
            name,
            location,
            price: parseInt(price, 10),
            description,
            amenities: amenities.split(',').map(a => a.trim()).filter(a => a),
            rating: initialData ? initialData.rating : 0, // Default to 0 for new, keep existing for edit
            verified,
            category: roomCategory,
            genderPreference,
            images,
        });
    };

    const isEditing = !!initialData;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{isEditing ? 'Edit Hostel' : 'Add a New Hostel'}</h2>
            <Input id="name" label="Hostel Name" value={name} onChange={e => setName(e.target.value)} required />
            <Input id="location" label="Location" value={location} onChange={e => setLocation(e.target.value)} required />

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Briefly describe the hostel, its environment, and what makes it special."
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input id="price" label="Price (PKR/month)" type="number" value={price} onChange={e => setPrice(e.target.value)} required />
                {/* Rating input removed as per requirement */}
                <div>
                    <label htmlFor="roomCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room Type</label>
                    <select
                        id="roomCategory"
                        value={roomCategory}
                        onChange={e => setRoomCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="Shared Room">Shared Room</option>
                        <option value="Private Room">Private Room</option>
                        <option value="Entire Place">Entire Place</option>
                        <option value="Dormitory">Dormitory</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="genderPreference" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender Preference</label>
                    <select
                        id="genderPreference"
                        value={genderPreference}
                        onChange={e => setGenderPreference(e.target.value as HostelCategory)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="boys">For Boys</option>
                        <option value="girls">For Girls</option>
                        <option value="any">For Anyone</option>
                    </select>
                </div>
            </div>

            <Input id="amenities" label="Amenities (comma-separated)" placeholder="e.g., wifi, laundry, mess" value={amenities} onChange={e => setAmenities(e.target.value)} />

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hostel Images</label>
                {images.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {images.map((image, index) => (
                            <div key={index} className="relative group">
                                <img src={image} alt={`Hostel preview ${index + 1}`} className="h-20 w-full object-cover rounded-md" />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute top-0 right-0 m-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Remove image"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-2">
                    <label htmlFor="file-upload" className={`relative cursor-pointer rounded-md bg-white dark:bg-gray-700 font-semibold text-blue-600 dark:text-blue-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500 dark:hover:text-blue-300 border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm ${images.length >= MAX_IMAGES ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <span>Add Images ({images.length}/{MAX_IMAGES})</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" multiple disabled={images.length >= MAX_IMAGES} />
                    </label>
                </div>
            </div>

            <div className="flex items-center">
                <input id="verified" type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500" />
                <label htmlFor="verified" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">Mark as Verified</label>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">{isEditing ? 'Save Changes' : 'Add Hostel'}</Button>
            </div>
        </form>
    );
};

export default PropertyListingForm;
