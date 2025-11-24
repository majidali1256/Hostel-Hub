const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
    hostelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hostel',
        required: true,
        unique: true
    },
    blockedDates: [{
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        reason: {
            type: String,
            maxlength: 200
        }
    }],
    maxCapacity: {
        type: Number,
        default: 1,
        min: 1
    },
    minStayDuration: {
        type: Number,
        default: 1,
        min: 1
    },
    maxStayDuration: {
        type: Number,
        default: 365,
        min: 1
    },
    advanceBookingDays: {
        type: Number,
        default: 90, // Can book up to 90 days in advance
        min: 1
    }
});

// Method to check if a date range is blocked
availabilitySchema.methods.isBlocked = function (checkIn, checkOut) {
    return this.blockedDates.some(blocked => {
        return (
            checkIn < blocked.endDate &&
            checkOut > blocked.startDate
        );
    });
};

// Method to add blocked dates
availabilitySchema.methods.blockDates = function (startDate, endDate, reason) {
    this.blockedDates.push({ startDate, endDate, reason });
    return this.save();
};

module.exports = mongoose.model('Availability', availabilitySchema);
