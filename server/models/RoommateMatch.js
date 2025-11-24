const mongoose = require('mongoose');

const roommateMatchSchema = new mongoose.Schema({
    user1Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    user2Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    compatibilityScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    scoreBreakdown: {
        lifestyle: {
            type: Number,
            default: 0
        },
        habits: {
            type: Number,
            default: 0
        },
        preferences: {
            type: Number,
            default: 0
        },
        interests: {
            type: Number,
            default: 0
        }
    },
    status: {
        type: String,
        enum: ['suggested', 'requested', 'accepted', 'declined'],
        default: 'suggested'
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    respondedAt: Date
});

// Indexes
roommateMatchSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });
roommateMatchSchema.index({ user1Id: 1, status: 1 });
roommateMatchSchema.index({ user2Id: 1, status: 1 });
roommateMatchSchema.index({ compatibilityScore: -1 });

// Method to accept match
roommateMatchSchema.methods.accept = function () {
    this.status = 'accepted';
    this.respondedAt = new Date();
    return this.save();
};

// Method to decline match
roommateMatchSchema.methods.decline = function () {
    this.status = 'declined';
    this.respondedAt = new Date();
    return this.save();
};

// Static method to find existing match
roommateMatchSchema.statics.findMatch = async function (user1Id, user2Id) {
    return await this.findOne({
        $or: [
            { user1Id, user2Id },
            { user1Id: user2Id, user2Id: user1Id }
        ]
    });
};

module.exports = mongoose.model('RoommateMatch', roommateMatchSchema);
