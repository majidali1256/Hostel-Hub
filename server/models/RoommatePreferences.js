const mongoose = require('mongoose');

const roommatePreferencesSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Basic Info
    bio: {
        type: String,
        maxlength: 500
    },
    age: {
        type: Number,
        min: 18,
        max: 100
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'non-binary', 'prefer-not-to-say']
    },
    occupation: String,

    // Lifestyle
    sleepSchedule: {
        type: String,
        enum: ['early-bird', 'night-owl', 'flexible'],
        default: 'flexible'
    },
    cleanliness: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    socialLevel: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },

    // Habits
    smoking: {
        type: String,
        enum: ['yes', 'no', 'occasionally'],
        default: 'no'
    },
    drinking: {
        type: String,
        enum: ['yes', 'no', 'occasionally'],
        default: 'occasionally'
    },
    pets: {
        type: String,
        enum: ['yes', 'no', 'allergic'],
        default: 'no'
    },

    // Preferences for Roommate
    preferredGender: [{
        type: String,
        enum: ['male', 'female', 'non-binary', 'any']
    }],
    preferredAgeRange: {
        min: {
            type: Number,
            default: 18
        },
        max: {
            type: Number,
            default: 100
        }
    },
    dealBreakers: [{
        type: String
    }],

    // Interests
    interests: [{
        type: String
    }],
    languages: [{
        type: String
    }],

    // Availability
    lookingForRoommate: {
        type: Boolean,
        default: true
    },
    moveInDate: Date,
    budgetRange: {
        min: Number,
        max: Number
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
roommatePreferencesSchema.index({ userId: 1 });
roommatePreferencesSchema.index({ lookingForRoommate: 1 });
roommatePreferencesSchema.index({ 'budgetRange.min': 1, 'budgetRange.max': 1 });

// Update timestamp on save
roommatePreferencesSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('RoommatePreferences', roommatePreferencesSchema);
