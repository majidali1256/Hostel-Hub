const { GoogleGenerativeAI } = require('@google/generative-ai');
const Hostel = require('../models/Hostel');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Predict fair rent based on hostel features using Gemini AI
 * @param {Object} features - Hostel features (location, amenities, roomType, etc.)
 * @returns {Object} - { minPrice, maxPrice, reasoning, confidence }
 */
const predictRent = async (features) => {
    const {
        location,
        roomType,
        amenities,
        capacity,
        genderPreference
    } = features;

    const prompt = `
    You are a real estate and hostel pricing expert in Pakistan. 
    Estimate a fair monthly rent range (in PKR) for a hostel with the following features:

    - Location: ${location}
    - Room Type: ${roomType}
    - Capacity: ${capacity} person(s)
    - Gender Preference: ${genderPreference}
    - Amenities: ${amenities.join(', ')}

    Consider current market rates in Pakistan (e.g., Lahore, Islamabad, Karachi).
    
    Return ONLY a valid JSON object with this format:
    {
        "minPrice": number,
        "maxPrice": number,
        "reasoning": "Brief explanation of the estimate based on location and amenities",
        "confidence": "High" | "Medium" | "Low"
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('Failed to parse AI response');
    } catch (error) {
        console.error('Error predicting rent:', error);
        // Fallback to basic rule-based estimation if AI fails
        return calculateFallbackPrice(features);
    }
};

/**
 * Fallback price calculation if AI fails
 */
const calculateFallbackPrice = (features) => {
    let basePrice = 15000; // Base price for a standard shared room

    // Adjust based on room type
    if (features.roomType === 'Private Room') basePrice += 10000;
    if (features.roomType === 'Entire Place') basePrice += 20000;
    if (features.roomType === 'Dormitory') basePrice -= 5000;

    // Adjust based on amenities count
    basePrice += (features.amenities.length * 500);

    return {
        minPrice: basePrice - 2000,
        maxPrice: basePrice + 2000,
        reasoning: "Estimate based on standard room rates and amenity count (AI unavailable).",
        confidence: "Low"
    };
};

/**
 * Get market benchmarks for a specific location
 * @param {String} location - Location string to search for
 */
const getAreaBenchmarks = async (location) => {
    try {
        // Simple aggregation of existing hostels in the database
        // In a real app, this would be more sophisticated with geospatial queries
        const regex = new RegExp(location, 'i');
        const hostels = await Hostel.find({ location: regex, status: 'Available' });

        if (hostels.length === 0) {
            return {
                averagePrice: 0,
                count: 0,
                priceRange: { min: 0, max: 0 }
            };
        }

        const prices = hostels.map(h => h.price);
        const sum = prices.reduce((a, b) => a + b, 0);
        const avg = Math.round(sum / hostels.length);
        const min = Math.min(...prices);
        const max = Math.max(...prices);

        return {
            averagePrice: avg,
            count: hostels.length,
            priceRange: { min, max }
        };
    } catch (error) {
        console.error('Error getting benchmarks:', error);
        return { averagePrice: 0, count: 0, priceRange: { min: 0, max: 0 } };
    }
};

module.exports = {
    predictRent,
    getAreaBenchmarks
};
