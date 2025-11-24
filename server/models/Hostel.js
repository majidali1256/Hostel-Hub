const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    date: { type: Date, default: Date.now }
});

const hostelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true },
    description: String,
    amenities: [String], // e.g., ['WiFi', 'Kitchen', 'Parking', 'AC', 'Laundry']
    category: {
        type: String,
        enum: ['Shared Room', 'Private Room', 'Entire Place', 'Dormitory'],
        required: true
    },
    status: {
        type: String,
        enum: ['Available', 'Booked', 'Maintenance', 'Inactive'],
        default: 'Available'
    },
    genderPreference: {
        type: String,
        enum: ['boys', 'girls', 'any'],
        default: 'any'
    },
    rating: { type: Number, default: 0 },
    reviews: [reviewSchema],
    ownerId: { type: String, required: true },
    verified: { type: Boolean, default: false },
    images: [String]
}, { timestamps: true });

// Calculate average rating from reviews
hostelSchema.methods.calculateAverageRating = function () {
    if (this.reviews.length === 0) {
        this.rating = 0;
    } else {
        const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
        this.rating = sum / this.reviews.length;
    }
};

// Map _id to id for frontend compatibility
hostelSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('Hostel', hostelSchema);
