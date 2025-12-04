const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    hostelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hostel',
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    totalPrice: {
        type: Number,
        required: true
    },
    numberOfGuests: {
        type: Number,
        default: 1,
        min: 1
    },
    specialRequests: {
        type: String,
        maxlength: 500
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'submitted', 'verified', 'rejected'],
        default: 'pending'
    },
    // Pakistani payment system
    paymentMethod: {
        type: String,
        enum: ['bank_transfer', 'jazzcash', 'easypaisa', 'other'],
    },
    paymentReceipt: {
        image: String, // Base64 or file path
        uploadedAt: Date,
        verified: Boolean,
        verifiedBy: mongoose.Schema.Types.ObjectId,
        verifiedAt: Date,
        rejectionReason: String
    },
    transactionId: String, // Customer's transaction reference number
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    confirmedAt: Date,
    cancelledAt: Date,
    cancelReason: String
});

// Index for efficient queries
bookingSchema.index({ hostelId: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ status: 1, checkIn: 1 });

// Method to check if booking overlaps with another
bookingSchema.methods.overlaps = function (otherBooking) {
    return (
        this.checkIn < otherBooking.checkOut &&
        this.checkOut > otherBooking.checkIn
    );
};

// Calculate duration in days
bookingSchema.virtual('duration').get(function () {
    const diffTime = Math.abs(this.checkOut - this.checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

module.exports = mongoose.model('Booking', bookingSchema);
