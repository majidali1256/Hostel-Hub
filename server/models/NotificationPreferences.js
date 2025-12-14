const mongoose = require('mongoose');

const notificationPreferencesSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    email: {
        bookings: {
            type: Boolean,
            default: true
        },
        messages: {
            type: Boolean,
            default: true
        },
        reviews: {
            type: Boolean,
            default: true
        },
        appointments: {
            type: Boolean,
            default: true
        },
        payments: {
            type: Boolean,
            default: true
        },
        marketing: {
            type: Boolean,
            default: false
        },
        system: {
            type: Boolean,
            default: true
        }
    },
    push: {
        bookings: {
            type: Boolean,
            default: true
        },
        messages: {
            type: Boolean,
            default: true
        },
        reviews: {
            type: Boolean,
            default: true
        },
        appointments: {
            type: Boolean,
            default: true
        },
        payments: {
            type: Boolean,
            default: true
        },
        system: {
            type: Boolean,
            default: false
        }
    },
    inApp: {
        bookings: {
            type: Boolean,
            default: true
        },
        messages: {
            type: Boolean,
            default: true
        },
        reviews: {
            type: Boolean,
            default: true
        },
        appointments: {
            type: Boolean,
            default: true
        },
        payments: {
            type: Boolean,
            default: true
        },
        system: {
            type: Boolean,
            default: true
        }
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Note: userId already has unique: true which creates an index

// Method to check if email should be sent
notificationPreferencesSchema.methods.shouldSendEmail = function (type) {
    return this.email[type] !== undefined ? this.email[type] : true;
};

// Method to check if push should be sent
notificationPreferencesSchema.methods.shouldSendPush = function (type) {
    return this.push[type] !== undefined ? this.push[type] : true;
};

// Method to check if in-app should be shown
notificationPreferencesSchema.methods.shouldShowInApp = function (type) {
    return this.inApp[type] !== undefined ? this.inApp[type] : true;
};

// Static method to get or create preferences
notificationPreferencesSchema.statics.getOrCreate = async function (userId) {
    let preferences = await this.findOne({ userId });
    if (!preferences) {
        preferences = new this({ userId });
        await preferences.save();
    }
    return preferences;
};

module.exports = mongoose.model('NotificationPreferences', notificationPreferencesSchema);
