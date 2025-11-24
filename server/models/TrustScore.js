const mongoose = require('mongoose');

const trustScoreSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    score: {
        type: Number,
        default: 50,
        min: 0,
        max: 100
    },
    // Verification factors
    factors: {
        verifiedEmail: {
            type: Boolean,
            default: false
        },
        verifiedPhone: {
            type: Boolean,
            default: false
        },
        verifiedId: {
            type: Boolean,
            default: false
        },
        completedBookings: {
            type: Number,
            default: 0
        },
        responseRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        responseTime: {
            type: Number,
            default: 0 // in hours
        },
        cancellationRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        positiveReviews: {
            type: Number,
            default: 0
        },
        accountAge: {
            type: Number,
            default: 0 // in days
        }
    },
    // Achievement badges
    badges: [{
        type: String,
        enum: [
            'verified',
            'superhost',
            'responsive',
            'reliable',
            'experienced',
            'new',
            'top-rated'
        ]
    }],
    lastCalculated: {
        type: Date,
        default: Date.now
    }
});

// Index
trustScoreSchema.index({ userId: 1 });
trustScoreSchema.index({ score: -1 });

// Method to calculate trust score
trustScoreSchema.methods.calculate = async function () {
    let score = 0;
    const factors = this.factors;

    // Email verification: 10 points
    if (factors.verifiedEmail) score += 10;

    // Phone verification: 10 points
    if (factors.verifiedPhone) score += 10;

    // ID verification: 15 points
    if (factors.verifiedId) score += 15;

    // Completed bookings: up to 20 points
    score += Math.min(factors.completedBookings * 2, 20);

    // Response rate: up to 15 points
    score += (factors.responseRate / 100) * 15;

    // Response time: up to 10 points (faster = better)
    if (factors.responseTime > 0) {
        const responseScore = Math.max(0, 10 - (factors.responseTime / 24) * 2);
        score += responseScore;
    }

    // Low cancellation rate: up to 10 points
    score += Math.max(0, 10 - (factors.cancellationRate / 10));

    // Positive reviews: up to 10 points
    score += Math.min(factors.positiveReviews, 10);

    // Account age: up to 10 points (1 point per 30 days, max 300 days)
    score += Math.min(factors.accountAge / 30, 10);

    this.score = Math.min(Math.round(score), 100);
    this.lastCalculated = new Date();

    // Assign badges based on score and factors
    this.assignBadges();

    return this.save();
};

// Method to assign badges
trustScoreSchema.methods.assignBadges = function () {
    const badges = [];
    const factors = this.factors;

    // Verified badge
    if (factors.verifiedEmail && factors.verifiedPhone) {
        badges.push('verified');
    }

    // Superhost badge
    if (this.score >= 90 && factors.completedBookings >= 10 && factors.positiveReviews >= 8) {
        badges.push('superhost');
    }

    // Responsive badge
    if (factors.responseRate >= 90 && factors.responseTime <= 2) {
        badges.push('responsive');
    }

    // Reliable badge
    if (factors.cancellationRate <= 5 && factors.completedBookings >= 5) {
        badges.push('reliable');
    }

    // Experienced badge
    if (factors.completedBookings >= 20) {
        badges.push('experienced');
    }

    // New badge
    if (factors.accountAge <= 30) {
        badges.push('new');
    }

    // Top-rated badge
    if (this.score >= 85 && factors.positiveReviews >= 5) {
        badges.push('top-rated');
    }

    this.badges = badges;
};

// Static method to update trust score for a user
trustScoreSchema.statics.updateForUser = async function (userId) {
    const User = mongoose.model('User');
    const Booking = mongoose.model('Booking');
    const Review = mongoose.model('Review');
    const Message = mongoose.model('Message');

    let trustScore = await this.findOne({ userId });
    if (!trustScore) {
        trustScore = new this({ userId });
    }

    const user = await User.findById(userId);
    if (!user) return null;

    // Update verification status
    trustScore.factors.verifiedEmail = user.isVerified || false;
    trustScore.factors.verifiedPhone = user.phoneVerified || false;
    trustScore.factors.verifiedId = user.idVerified || false;

    // Calculate account age
    const accountAge = Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24));
    trustScore.factors.accountAge = accountAge;

    // Count completed bookings
    const completedBookings = await Booking.countDocuments({
        $or: [{ customerId: userId }, { hostelId: { $in: await getHostelIds(userId) } }],
        status: 'completed'
    });
    trustScore.factors.completedBookings = completedBookings;

    // Calculate cancellation rate
    const totalBookings = await Booking.countDocuments({
        customerId: userId
    });
    const cancelledBookings = await Booking.countDocuments({
        customerId: userId,
        status: 'cancelled'
    });
    trustScore.factors.cancellationRate = totalBookings > 0
        ? Math.round((cancelledBookings / totalBookings) * 100)
        : 0;

    // Count positive reviews
    const positiveReviews = await Review.countDocuments({
        reviewerId: userId,
        rating: { $gte: 4 },
        status: 'approved'
    });
    trustScore.factors.positiveReviews = positiveReviews;

    // Calculate response rate and time (for owners)
    if (user.role === 'owner') {
        // This would need message tracking implementation
        trustScore.factors.responseRate = 85; // Placeholder
        trustScore.factors.responseTime = 2; // Placeholder
    }

    await trustScore.calculate();
    return trustScore;
};

// Helper function to get hostel IDs for a user
async function getHostelIds(userId) {
    const Hostel = mongoose.model('Hostel');
    const hostels = await Hostel.find({ ownerId: userId }).select('_id');
    return hostels.map(h => h._id);
}

module.exports = mongoose.model('TrustScore', trustScoreSchema);
