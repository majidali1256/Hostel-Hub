const mongoose = require('mongoose');

const priceAnalysisSchema = new mongoose.Schema({
    hostelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hostel',
        required: true,
        unique: true,
        index: true
    },
    currentPrice: {
        type: Number,
        required: true
    },
    recommendedPrice: {
        type: Number,
        required: true
    },
    priceRange: {
        min: { type: Number, required: true },
        max: { type: Number, required: true }
    },
    marketPosition: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
    },
    competitorAnalysis: [{
        hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel' },
        name: String,
        price: Number,
        distance: Number, // in km
        rating: Number,
        occupancyRate: Number
    }],
    demandScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
    },
    seasonalityFactor: {
        type: Number,
        min: 0.5,
        max: 2.0,
        default: 1.0
    },
    amenityScore: {
        type: Number,
        min: 0,
        max: 25,
        default: 0
    },
    locationScore: {
        type: Number,
        min: 0,
        max: 30,
        default: 0
    },
    occupancyRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    revenueOptimization: {
        currentRevenue: { type: Number, default: 0 },
        projectedRevenue: { type: Number, default: 0 },
        revenueIncrease: { type: Number, default: 0 }
    },
    scoreBreakdown: {
        location: { type: Number, default: 0 },
        amenities: { type: Number, default: 0 },
        marketPosition: { type: Number, default: 0 },
        demand: { type: Number, default: 0 },
        competition: { type: Number, default: 0 }
    },
    priceHistory: [{
        price: Number,
        date: { type: Date, default: Date.now },
        occupancyRate: Number,
        revenue: Number
    }],
    lastAnalyzed: {
        type: Date,
        default: Date.now
    },
    confidenceScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 70
    }
}, {
    timestamps: true
});

// Index for efficient queries
priceAnalysisSchema.index({ lastAnalyzed: -1 });
priceAnalysisSchema.index({ 'competitorAnalysis.hostelId': 1 });

// Method to update analysis
priceAnalysisSchema.methods.updateAnalysis = async function (analysisData) {
    Object.assign(this, analysisData);
    this.lastAnalyzed = new Date();

    // Add to price history
    this.priceHistory.push({
        price: this.currentPrice,
        date: new Date(),
        occupancyRate: this.occupancyRate,
        revenue: this.revenueOptimization.currentRevenue
    });

    // Keep only last 90 days of history
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    this.priceHistory = this.priceHistory.filter(h => h.date >= ninetyDaysAgo);

    return this.save();
};

// Method to get price history
priceAnalysisSchema.methods.getPriceHistory = function (days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.priceHistory.filter(h => h.date >= cutoffDate);
};

// Method to get competitors
priceAnalysisSchema.methods.getCompetitors = function () {
    return this.competitorAnalysis.sort((a, b) => a.distance - b.distance);
};

// Static method to find outdated analyses
priceAnalysisSchema.statics.findOutdated = async function (hours = 24) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    return this.find({
        lastAnalyzed: { $lt: cutoffDate }
    });
};

// Static method to get market statistics
priceAnalysisSchema.statics.getMarketStats = async function (location) {
    const Hostel = mongoose.model('Hostel');

    // Find hostels in the same city
    const hostels = await Hostel.find({ 'location.city': location });
    const hostelIds = hostels.map(h => h._id);

    const analyses = await this.find({ hostelId: { $in: hostelIds } });

    if (analyses.length === 0) {
        return null;
    }

    const prices = analyses.map(a => a.currentPrice);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const sortedPrices = prices.sort((a, b) => a - b);
    const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];

    return {
        location,
        totalListings: analyses.length,
        averagePrice: Math.round(avgPrice),
        medianPrice,
        priceRange: {
            min: Math.min(...prices),
            max: Math.max(...prices)
        },
        averageOccupancy: analyses.reduce((a, b) => a + b.occupancyRate, 0) / analyses.length,
        averageDemand: analyses.reduce((a, b) => a + b.demandScore, 0) / analyses.length
    };
};

module.exports = mongoose.model('PriceAnalysis', priceAnalysisSchema);
