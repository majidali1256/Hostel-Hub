const mongoose = require('mongoose');

const marketTrendSchema = new mongoose.Schema({
    location: {
        type: String,
        required: true,
        index: true
    },
    period: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'daily'
    },
    date: {
        type: Date,
        default: Date.now,
        index: true
    },
    averagePrice: {
        type: Number,
        required: true
    },
    medianPrice: {
        type: Number,
        required: true
    },
    priceRange: {
        min: { type: Number, required: true },
        max: { type: Number, required: true }
    },
    totalListings: {
        type: Number,
        default: 0
    },
    occupancyRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    demandIndex: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
    },
    seasonalTrend: {
        type: String,
        enum: ['low', 'medium', 'high', 'peak'],
        default: 'medium'
    },
    growthRate: {
        type: Number,
        default: 0 // Percentage change from previous period
    },
    topAmenities: [{
        name: String,
        count: Number,
        avgPriceImpact: Number
    }],
    priceByType: {
        private: { avg: Number, count: Number },
        shared: { avg: Number, count: Number },
        dorm: { avg: Number, count: Number }
    },
    bookingVolume: {
        type: Number,
        default: 0
    },
    searchVolume: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
marketTrendSchema.index({ location: 1, date: -1 });
marketTrendSchema.index({ location: 1, period: 1, date: -1 });

// Method to calculate trends
marketTrendSchema.statics.calculateTrends = async function (location, period = 'daily') {
    const PriceAnalysis = mongoose.model('PriceAnalysis');
    const Hostel = mongoose.model('Hostel');

    // Find all hostels in location
    const hostels = await Hostel.find({ 'location.city': location });
    const hostelIds = hostels.map(h => h._id);

    // Get price analyses
    const analyses = await PriceAnalysis.find({
        hostelId: { $in: hostelIds }
    }).populate('hostelId');

    if (analyses.length < 5) {
        return null; // Not enough data
    }

    // Calculate statistics
    const prices = analyses.map(a => a.currentPrice);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const sortedPrices = prices.sort((a, b) => a - b);
    const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];

    // Calculate occupancy
    const avgOccupancy = analyses.reduce((a, b) => a + b.occupancyRate, 0) / analyses.length;

    // Calculate demand
    const avgDemand = analyses.reduce((a, b) => a + b.demandScore, 0) / analyses.length;

    // Determine seasonal trend
    const month = new Date().getMonth();
    let seasonalTrend = 'medium';
    if ([11, 0, 1].includes(month)) seasonalTrend = 'peak'; // Winter holidays
    else if ([5, 6, 7].includes(month)) seasonalTrend = 'high'; // Summer
    else if ([2, 3, 4].includes(month)) seasonalTrend = 'medium'; // Spring
    else seasonalTrend = 'low'; // Fall

    // Get previous trend for growth rate
    const previousTrend = await this.findOne({
        location,
        period,
        date: { $lt: new Date() }
    }).sort({ date: -1 });

    const growthRate = previousTrend
        ? ((avgPrice - previousTrend.averagePrice) / previousTrend.averagePrice) * 100
        : 0;

    // Analyze amenities
    const amenityMap = new Map();
    analyses.forEach(analysis => {
        const hostel = analysis.hostelId;
        if (hostel && hostel.amenities) {
            hostel.amenities.forEach(amenity => {
                if (!amenityMap.has(amenity)) {
                    amenityMap.set(amenity, { count: 0, totalPrice: 0 });
                }
                const data = amenityMap.get(amenity);
                data.count++;
                data.totalPrice += analysis.currentPrice;
            });
        }
    });

    const topAmenities = Array.from(amenityMap.entries())
        .map(([name, data]) => ({
            name,
            count: data.count,
            avgPriceImpact: Math.round(data.totalPrice / data.count - avgPrice)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // Price by type
    const priceByType = {
        private: { avg: 0, count: 0 },
        shared: { avg: 0, count: 0 },
        dorm: { avg: 0, count: 0 }
    };

    analyses.forEach(analysis => {
        const hostel = analysis.hostelId;
        if (hostel && hostel.roomType) {
            const type = hostel.roomType.toLowerCase();
            if (priceByType[type]) {
                priceByType[type].count++;
                priceByType[type].avg += analysis.currentPrice;
            }
        }
    });

    Object.keys(priceByType).forEach(type => {
        if (priceByType[type].count > 0) {
            priceByType[type].avg = Math.round(priceByType[type].avg / priceByType[type].count);
        }
    });

    return {
        location,
        period,
        date: new Date(),
        averagePrice: Math.round(avgPrice),
        medianPrice,
        priceRange: {
            min: Math.min(...prices),
            max: Math.max(...prices)
        },
        totalListings: analyses.length,
        occupancyRate: Math.round(avgOccupancy),
        demandIndex: Math.round(avgDemand),
        seasonalTrend,
        growthRate: Math.round(growthRate * 100) / 100,
        topAmenities,
        priceByType
    };
};

// Method to get prediction
marketTrendSchema.statics.getPrediction = async function (location, daysAhead = 30) {
    const trends = await this.find({ location })
        .sort({ date: -1 })
        .limit(30);

    if (trends.length < 7) {
        return null; // Not enough historical data
    }

    // Simple linear regression for prediction
    const prices = trends.map(t => t.averagePrice).reverse();
    const n = prices.length;
    const xSum = (n * (n + 1)) / 2;
    const ySum = prices.reduce((a, b) => a + b, 0);
    const xySum = prices.reduce((sum, y, i) => sum + y * (i + 1), 0);
    const x2Sum = (n * (n + 1) * (2 * n + 1)) / 6;

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;

    const predictedPrice = slope * (n + daysAhead) + intercept;

    return {
        location,
        daysAhead,
        currentAverage: trends[0].averagePrice,
        predictedPrice: Math.round(predictedPrice),
        trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
        confidence: Math.min(95, 50 + (n * 2)) // Higher confidence with more data
    };
};

// Method to compare hostel to market
marketTrendSchema.statics.compareToMarket = async function (hostelId) {
    const PriceAnalysis = mongoose.model('PriceAnalysis');
    const Hostel = mongoose.model('Hostel');

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return null;

    const analysis = await PriceAnalysis.findOne({ hostelId });
    if (!analysis) return null;

    const marketTrend = await this.findOne({
        location: hostel.location.city
    }).sort({ date: -1 });

    if (!marketTrend) return null;

    const priceDiff = analysis.currentPrice - marketTrend.averagePrice;
    const priceDiffPercent = (priceDiff / marketTrend.averagePrice) * 100;

    return {
        hostelPrice: analysis.currentPrice,
        marketAverage: marketTrend.averagePrice,
        difference: Math.round(priceDiff),
        differencePercent: Math.round(priceDiffPercent * 100) / 100,
        position: priceDiffPercent > 10 ? 'above' : priceDiffPercent < -10 ? 'below' : 'at',
        marketTrend: marketTrend.seasonalTrend,
        recommendation: priceDiffPercent > 20 ? 'Consider lowering price' :
            priceDiffPercent < -20 ? 'Room to increase price' :
                'Price is competitive'
    };
};

module.exports = mongoose.model('MarketTrend', marketTrendSchema);
