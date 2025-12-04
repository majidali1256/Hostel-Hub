const Hostel = require('../models/Hostel');
const geminiService = require('./geminiService');

/**
 * Advanced search with filters
 */
const searchHostels = async (filters = {}) => {
    try {
        const {
            query,
            location,
            minPrice,
            maxPrice,
            amenities,
            minRating,
            sortBy = 'rating',
            page = 1,
            limit = 20
        } = filters;

        // Build search query
        let searchQuery = {};

        // Text search (name, description, location)
        if (query) {
            searchQuery.$or = [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { location: { $regex: query, $options: 'i' } }
            ];
        }

        // Location filter
        if (location) {
            searchQuery.location = { $regex: location, $options: 'i' };
        }

        // Price range
        if (minPrice !== undefined || maxPrice !== undefined) {
            searchQuery.price = {};
            if (minPrice !== undefined) searchQuery.price.$gte = minPrice;
            if (maxPrice !== undefined) searchQuery.price.$lte = maxPrice;
        }

        // Amenities filter
        if (amenities && amenities.length > 0) {
            searchQuery.amenities = { $all: amenities };
        }

        // Rating filter
        if (minRating) {
            searchQuery.rating = { $gte: minRating };
        }

        // Execute search
        const skip = (page - 1) * limit;
        let sortOptions = {};

        switch (sortBy) {
            case 'price_low':
                sortOptions = { price: 1 };
                break;
            case 'price_high':
                sortOptions = { price: -1 };
                break;
            case 'rating':
                sortOptions = { rating: -1, reviewCount: -1 };
                break;
            case 'newest':
                sortOptions = { createdAt: -1 };
                break;
            default:
                sortOptions = { rating: -1 };
        }

        const hostels = await Hostel.find(searchQuery)
            .populate('ownerId', 'firstName lastName contactNumber')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        const total = await Hostel.countDocuments(searchQuery);

        return {
            hostels,
            total,
            page,
            pages: Math.ceil(total / limit),
            hasMore: skip + hostels.length < total
        };
    } catch (error) {
        console.error('Search error:', error);
        throw error;
    }
};

/**
 * AI-powered smart search
 */
const smartSearch = async (query, userProfile = {}, options = {}) => {
    try {
        // Parse query using AI
        const parsedQuery = await geminiService.parseSearchQuery(query);

        // Build filters from parsed query
        const filters = {
            query: parsedQuery.keywords?.join(' ') || query,
            location: parsedQuery.location,
            minPrice: parsedQuery.priceRange?.min,
            maxPrice: parsedQuery.priceRange?.max,
            amenities: parsedQuery.amenities,
            ...options
        };

        // Get search results
        const results = await searchHostels(filters);

        // Apply AI ranking if user profile available
        if (userProfile.userId && results.hostels.length > 0) {
            results.hostels = await geminiService.rankSearchResults(
                results.hostels,
                parsedQuery,
                userProfile
            );
        }

        return {
            ...results,
            parsedQuery,
            aiEnhanced: true
        };
    } catch (error) {
        console.error('Smart search error:', error);
        // Fallback to regular search
        return await searchHostels({ query, ...options });
    }
};

/**
 * Get personalized recommendations for user
 */
const getRecommendations = async (userId, userProfile = {}) => {
    try {
        // Get all available hostels
        const hostels = await Hostel.find({ isActive: true })
            .populate('ownerId', 'firstName lastName')
            .limit(50); // Limit for AI processing

        if (hostels.length === 0) {
            return [];
        }

        // Get AI recommendations
        const recommendations = await geminiService.getPersonalizedRecommendations(
            hostels,
            userProfile
        );

        return recommendations;
    } catch (error) {
        console.error('Recommendations error:', error);
        // Fallback: return top-rated hostels
        return await Hostel.find({ isActive: true })
            .sort({ rating: -1 })
            .limit(5)
            .populate('ownerId', 'firstName lastName');
    }
};

/**
 * Get search suggestions
 */
const getSuggestions = async (partialQuery) => {
    try {
        // Get popular searches from database
        const popularLocations = await Hostel.distinct('location');
        const popularSearches = popularLocations.slice(0, 10);

        // Get AI suggestions
        const aiSuggestions = await geminiService.getSearchSuggestions(
            partialQuery,
            popularSearches
        );

        return aiSuggestions;
    } catch (error) {
        console.error('Suggestions error:', error);
        // Fallback to popular locations
        return await Hostel.distinct('location').limit(5);
    }
};

/**
 * Get available filters/facets
 */
const getSearchFilters = async () => {
    try {
        const [locations, amenities, priceStats] = await Promise.all([
            Hostel.distinct('location'),
            Hostel.distinct('amenities'),
            Hostel.aggregate([
                {
                    $group: {
                        _id: null,
                        minPrice: { $min: '$price' },
                        maxPrice: { $max: '$price' },
                        avgPrice: { $avg: '$price' }
                    }
                }
            ])
        ]);

        return {
            locations: locations.sort(),
            amenities: amenities.flat().filter((v, i, a) => a.indexOf(v) === i).sort(),
            priceRange: priceStats[0] || { minPrice: 0, maxPrice: 100000, avgPrice: 20000 }
        };
    } catch (error) {
        console.error('Filters error:', error);
        return {
            locations: [],
            amenities: [],
            priceRange: { minPrice: 0, maxPrice: 100000, avgPrice: 20000 }
        };
    }
};

module.exports = {
    searchHostels,
    smartSearch,
    getRecommendations,
    getSuggestions,
    getSearchFilters
};
