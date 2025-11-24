const PriceAnalysis = require('../models/PriceAnalysis');
const MarketTrend = require('../models/MarketTrend');
const Hostel = require('../models/Hostel');
const Booking = require('../models/Booking');

class PriceAnalysisService {
    /**
     * Analyze hostel price and generate recommendations
     */
    static async analyzeHostelPrice(hostelId) {
        const hostel = await Hostel.findById(hostelId);
        if (!hostel) {
            throw new Error('Hostel not found');
        }

        // Calculate all scoring components
        const locationScore = await this.calculateLocationScore(hostel);
        const amenityScore = this.calculateAmenityScore(hostel);
        const marketPositionScore = await this.calculateMarketPositionScore(hostel);
        const demandScore = await this.calculateDemandScore(hostel);
        const competitionScore = await this.calculateCompetitionScore(hostel);

        // Get competitor analysis
        const competitors = await this.findCompetitors(hostel);

        // Calculate base price from scores
        const baseScore = locationScore + amenityScore + marketPositionScore + demandScore + competitionScore;
        const basePrice = this.scoreToPriceMapping(baseScore, hostel.location.city);

        // Apply seasonal and demand adjustments
        const seasonalityFactor = this.getSeasonalityFactor();
        const demandMultiplier = demandScore / 50; // Normalize to ~1.0

        const recommendedPrice = Math.round(basePrice * seasonalityFactor * demandMultiplier);

        // Calculate price range (±15%)
        const priceRange = {
            min: Math.round(recommendedPrice * 0.85),
            max: Math.round(recommendedPrice * 1.15)
        };

        // Calculate occupancy rate
        const occupancyRate = await this.calculateOccupancyRate(hostelId);

        // Calculate revenue optimization
        const revenueOptimization = this.calculateRevenueOptimization(
            hostel.price || recommendedPrice,
            recommendedPrice,
            occupancyRate
        );

        // Calculate market position percentile
        const marketPosition = await this.calculateMarketPercentile(hostel, recommendedPrice);

        // Calculate confidence score
        const confidenceScore = this.calculateConfidenceScore(competitors.length, occupancyRate);

        // Create or update analysis
        let analysis = await PriceAnalysis.findOne({ hostelId });

        const analysisData = {
            hostelId,
            currentPrice: hostel.price || recommendedPrice,
            recommendedPrice,
            priceRange,
            marketPosition,
            competitorAnalysis: competitors,
            demandScore,
            seasonalityFactor,
            amenityScore,
            locationScore,
            occupancyRate,
            revenueOptimization,
            scoreBreakdown: {
                location: locationScore,
                amenities: amenityScore,
                marketPosition: marketPositionScore,
                demand: demandScore,
                competition: competitionScore
            },
            confidenceScore
        };

        if (analysis) {
            await analysis.updateAnalysis(analysisData);
        } else {
            analysis = new PriceAnalysis(analysisData);
            await analysis.save();
        }

        return analysis;
    }

    /**
     * Calculate location score (0-30 points)
     */
    static async calculateLocationScore(hostel) {
        let score = 0;

        // City tier scoring
        const majorCities = ['New York', 'Los Angeles', 'San Francisco', 'Chicago', 'Boston', 'Seattle'];
        const mediumCities = ['Austin', 'Denver', 'Portland', 'Miami', 'Nashville'];

        if (majorCities.includes(hostel.location.city)) {
            score += 15;
        } else if (mediumCities.includes(hostel.location.city)) {
            score += 10;
        } else {
            score += 5;
        }

        // Proximity to attractions (simplified - in real app, use geolocation)
        if (hostel.location.address && hostel.location.address.toLowerCase().includes('downtown')) {
            score += 10;
        } else {
            score += 5;
        }

        // Transportation access (based on amenities)
        if (hostel.amenities && hostel.amenities.some(a => a.toLowerCase().includes('transport'))) {
            score += 5;
        }

        return Math.min(score, 30);
    }

    /**
     * Calculate amenity score (0-25 points)
     */
    static calculateAmenityScore(hostel) {
        if (!hostel.amenities || hostel.amenities.length === 0) {
            return 5;
        }

        const premiumAmenities = ['pool', 'gym', 'spa', 'restaurant', 'bar', 'rooftop'];
        const essentialAmenities = ['wifi', 'ac', 'heating', 'kitchen', 'laundry'];

        let score = 0;

        // Essential amenities (up to 10 points)
        const essentialCount = hostel.amenities.filter(a =>
            essentialAmenities.some(e => a.toLowerCase().includes(e))
        ).length;
        score += Math.min(essentialCount * 2, 10);

        // Premium amenities (up to 10 points)
        const premiumCount = hostel.amenities.filter(a =>
            premiumAmenities.some(p => a.toLowerCase().includes(p))
        ).length;
        score += Math.min(premiumCount * 3, 10);

        // Total amenity count bonus (up to 5 points)
        score += Math.min(hostel.amenities.length, 5);

        return Math.min(score, 25);
    }

    /**
     * Calculate market position score (0-20 points)
     */
    static async calculateMarketPositionScore(hostel) {
        let score = 0;

        // Rating score (up to 10 points)
        if (hostel.rating) {
            score += (hostel.rating / 5) * 10;
        } else {
            score += 5; // Default for new listings
        }

        // Review count (up to 5 points)
        const reviewCount = hostel.reviews ? hostel.reviews.length : 0;
        score += Math.min(reviewCount / 10, 5);

        // Booking history (up to 5 points)
        const bookingCount = await Booking.countDocuments({ hostelId: hostel._id });
        score += Math.min(bookingCount / 20, 5);

        return Math.min(score, 20);
    }

    /**
     * Calculate demand score (0-15 points)
     */
    static async calculateDemandScore(hostel) {
        // Get recent bookings
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentBookings = await Booking.countDocuments({
            hostelId: hostel._id,
            createdAt: { $gte: thirtyDaysAgo }
        });

        // Seasonal demand
        const seasonalBonus = this.getSeasonalDemandBonus();

        // Calculate score
        let score = Math.min(recentBookings, 10) + seasonalBonus;

        return Math.min(score, 15);
    }

    /**
     * Calculate competition score (0-10 points)
     */
    static async calculateCompetitionScore(hostel) {
        const competitors = await this.findCompetitors(hostel);

        if (competitors.length === 0) {
            return 10; // No competition = high score
        }

        // Lower score if many competitors
        const competitionPenalty = Math.min(competitors.length / 2, 5);

        // Bonus if priced competitively
        const avgCompetitorPrice = competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length;
        const priceCompetitiveness = hostel.price && hostel.price <= avgCompetitorPrice ? 5 : 2;

        return Math.max(10 - competitionPenalty + priceCompetitiveness, 0);
    }

    /**
     * Find competitor hostels
     */
    static async findCompetitors(hostel, radius = 5) {
        // Find hostels in same city (simplified - in real app, use geolocation)
        const competitors = await Hostel.find({
            _id: { $ne: hostel._id },
            'location.city': hostel.location.city,
            isActive: true
        }).limit(10);

        const competitorData = [];

        for (const competitor of competitors) {
            const analysis = await PriceAnalysis.findOne({ hostelId: competitor._id });

            competitorData.push({
                hostelId: competitor._id,
                name: competitor.name,
                price: competitor.price || 0,
                distance: Math.random() * radius, // Simplified
                rating: competitor.rating || 0,
                occupancyRate: analysis ? analysis.occupancyRate : 0
            });
        }

        return competitorData.sort((a, b) => a.distance - b.distance);
    }

    /**
     * Map score to price
     */
    static scoreToPriceMapping(score, city) {
        // Base price ranges by city tier
        const cityMultipliers = {
            'New York': 1.5,
            'Los Angeles': 1.4,
            'San Francisco': 1.6,
            'Chicago': 1.3,
            'Boston': 1.4,
            'Seattle': 1.3
        };

        const multiplier = cityMultipliers[city] || 1.0;

        // Score to base price (before city multiplier)
        // Score range: 0-100, Price range: $20-$100
        const basePrice = 20 + (score * 0.8);

        return Math.round(basePrice * multiplier);
    }

    /**
     * Get seasonality factor
     */
    static getSeasonalityFactor() {
        const month = new Date().getMonth();

        // Winter holidays (Dec, Jan, Feb)
        if ([11, 0, 1].includes(month)) return 1.3;

        // Summer (Jun, Jul, Aug)
        if ([5, 6, 7].includes(month)) return 1.2;

        // Spring (Mar, Apr, May)
        if ([2, 3, 4].includes(month)) return 1.0;

        // Fall (Sep, Oct, Nov)
        return 0.9;
    }

    /**
     * Get seasonal demand bonus
     */
    static getSeasonalDemandBonus() {
        const month = new Date().getMonth();
        if ([11, 0, 1, 5, 6, 7].includes(month)) return 5; // Peak seasons
        return 2;
    }

    /**
     * Calculate occupancy rate
     */
    static async calculateOccupancyRate(hostelId) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const bookings = await Booking.find({
            hostelId,
            checkInDate: { $gte: thirtyDaysAgo }
        });

        if (bookings.length === 0) return 0;

        // Calculate booked days vs available days
        const totalDays = 30;
        const bookedDays = bookings.reduce((sum, booking) => {
            const days = Math.ceil((booking.checkOutDate - booking.checkInDate) / (1000 * 60 * 60 * 24));
            return sum + days;
        }, 0);

        return Math.min(Math.round((bookedDays / totalDays) * 100), 100);
    }

    /**
     * Calculate revenue optimization
     */
    static calculateRevenueOptimization(currentPrice, recommendedPrice, occupancyRate) {
        const avgDaysBooked = (occupancyRate / 100) * 30;

        const currentRevenue = currentPrice * avgDaysBooked;

        // Assume price increase might reduce occupancy slightly
        const priceRatio = recommendedPrice / currentPrice;
        const adjustedOccupancy = priceRatio > 1
            ? Math.max(occupancyRate * 0.95, 50)
            : Math.min(occupancyRate * 1.05, 100);

        const projectedDaysBooked = (adjustedOccupancy / 100) * 30;
        const projectedRevenue = recommendedPrice * projectedDaysBooked;

        return {
            currentRevenue: Math.round(currentRevenue),
            projectedRevenue: Math.round(projectedRevenue),
            revenueIncrease: Math.round(((projectedRevenue - currentRevenue) / currentRevenue) * 100)
        };
    }

    /**
     * Calculate market percentile
     */
    static async calculateMarketPercentile(hostel, price) {
        const allHostels = await Hostel.find({
            'location.city': hostel.location.city,
            isActive: true
        });

        if (allHostels.length < 2) return 50;

        const prices = allHostels.map(h => h.price || price).sort((a, b) => a - b);
        const position = prices.findIndex(p => p >= price);

        return Math.round((position / prices.length) * 100);
    }

    /**
     * Calculate confidence score
     */
    static calculateConfidenceScore(competitorCount, occupancyRate) {
        let score = 50;

        // More competitors = more data = higher confidence
        score += Math.min(competitorCount * 3, 30);

        // Higher occupancy = more reliable data
        score += Math.min(occupancyRate / 5, 20);

        return Math.min(score, 100);
    }

    /**
     * Get recommended price
     */
    static async getRecommendedPrice(hostelId) {
        let analysis = await PriceAnalysis.findOne({ hostelId });

        if (!analysis) {
            analysis = await this.analyzeHostelPrice(hostelId);
        }

        return {
            recommendedPrice: analysis.recommendedPrice,
            priceRange: analysis.priceRange,
            currentPrice: analysis.currentPrice,
            confidence: analysis.confidenceScore,
            revenueImpact: analysis.revenueOptimization
        };
    }

    /**
     * Get market trends
     */
    static async getMarketTrends(location) {
        let trend = await MarketTrend.findOne({ location }).sort({ date: -1 });

        if (!trend) {
            const trendData = await MarketTrend.calculateTrends(location);
            if (trendData) {
                trend = new MarketTrend(trendData);
                await trend.save();
            }
        }

        return trend;
    }

    /**
     * Compare to competitors
     */
    static async compareToCompetitors(hostelId) {
        const analysis = await PriceAnalysis.findOne({ hostelId });

        if (!analysis) {
            throw new Error('Price analysis not found');
        }

        return {
            yourPrice: analysis.currentPrice,
            recommendedPrice: analysis.recommendedPrice,
            competitors: analysis.competitorAnalysis,
            marketPosition: analysis.marketPosition
        };
    }
}

module.exports = PriceAnalysisService;
