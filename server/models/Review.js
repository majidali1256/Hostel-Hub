const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    hostelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hostel',
        required: true
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    reviewerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Overall rating
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    // Detailed ratings
    cleanliness: {
        type: Number,
        min: 1,
        max: 5
    },
    accuracy: {
        type: Number,
        min: 1,
        max: 5
    },
    communication: {
        type: Number,
        min: 1,
        max: 5
    },
    location: {
        type: Number,
        min: 1,
        max: 5
    },
    value: {
        type: Number,
        min: 1,
        max: 5
    },
    // Review content
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    comment: {
        type: String,
        required: true,
        maxlength: 2000
    },
    photos: [{
        type: String
    }],
    // Engagement
    helpfulVotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Owner response
    response: {
        content: String,
        responderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        respondedAt: Date
    },
    // Moderation
    status: {
        type: String,
        enum: ['pending', 'approved', 'flagged', 'rejected'],
        default: 'approved'
    },
    flagReason: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
reviewSchema.index({ hostelId: 1, createdAt: -1 });
reviewSchema.index({ reviewerId: 1 });
reviewSchema.index({ bookingId: 1 });
reviewSchema.index({ status: 1 });

// Virtual for helpful count
reviewSchema.virtual('helpfulCount').get(function () {
    return this.helpfulVotes.length;
});

// Method to check if user found review helpful
reviewSchema.methods.isHelpful = function (userId) {
    return this.helpfulVotes.some(id => id.toString() === userId.toString());
};

// Method to toggle helpful vote
reviewSchema.methods.toggleHelpful = function (userId) {
    const index = this.helpfulVotes.findIndex(id => id.toString() === userId.toString());
    if (index > -1) {
        this.helpfulVotes.splice(index, 1);
    } else {
        this.helpfulVotes.push(userId);
    }
    return this.save();
};

// Static method to calculate average ratings for a hostel
reviewSchema.statics.getHostelRatings = async function (hostelId) {
    const result = await this.aggregate([
        { $match: { hostelId: new mongoose.Types.ObjectId(hostelId), status: 'approved' } },
        {
            $group: {
                _id: null,
                avgRating: { $avg: '$rating' },
                avgCleanliness: { $avg: '$cleanliness' },
                avgAccuracy: { $avg: '$accuracy' },
                avgCommunication: { $avg: '$communication' },
                avgLocation: { $avg: '$location' },
                avgValue: { $avg: '$value' },
                totalReviews: { $sum: 1 },
                ratings: {
                    $push: {
                        rating: '$rating',
                        createdAt: '$createdAt'
                    }
                }
            }
        }
    ]);

    if (result.length === 0) {
        return {
            avgRating: 0,
            totalReviews: 0,
            breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        };
    }

    const data = result[0];

    // Calculate rating breakdown
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    data.ratings.forEach(r => {
        breakdown[Math.round(r.rating)]++;
    });

    return {
        avgRating: Math.round(data.avgRating * 10) / 10,
        avgCleanliness: Math.round(data.avgCleanliness * 10) / 10,
        avgAccuracy: Math.round(data.avgAccuracy * 10) / 10,
        avgCommunication: Math.round(data.avgCommunication * 10) / 10,
        avgLocation: Math.round(data.avgLocation * 10) / 10,
        avgValue: Math.round(data.avgValue * 10) / 10,
        totalReviews: data.totalReviews,
        breakdown
    };
};

module.exports = mongoose.model('Review', reviewSchema);
