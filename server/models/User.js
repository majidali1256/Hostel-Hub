const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: {
        type: String,
        required: function () {
            return this.authProvider === 'local';
        }
    },
    role: { type: String, enum: ['owner', 'customer', 'pending', 'admin'], default: 'pending' },
    authProvider: { type: String, enum: ['local', 'google', 'facebook'], default: 'local' },
    googleId: { type: String },
    facebookId: { type: String },
    firstName: String,
    lastName: String,
    contactNumber: String,
    stayHistory: [String],
    profilePicture: String,
    trustScore: { type: Number, default: 50, min: 0, max: 100 }, // Calculated trust score 0-100
    verificationDocuments: [String], // URLs to uploaded verification documents
    emailVerified: { type: Boolean, default: false },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    // Identity Verification
    verificationStatus: {
        type: String,
        enum: ['unverified', 'pending', 'verified', 'rejected'],
        default: 'unverified'
    },
    idDocument: String, // Path to uploaded document
    documentName: String, // Name/type of document (e.g., CNIC, Student ID)
    verificationDate: Date,
    rejectionReason: String,
    // Bank details for Pakistani payment system
    bankDetails: {
        bankName: String, // HBL, UBL, Meezan, Allied, MCB, etc.
        accountTitle: String,
        accountNumber: String,
        iban: String,
        jazzCashNumber: String,
        easyPaisaNumber: String,
        verified: { type: Boolean, default: false } // Admin verified
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to calculate trust score
userSchema.methods.calculateTrustScore = function () {
    let score = 0;

    // Basic Profile (50 points)
    const basicFields = ['username', 'email', 'contactNumber', 'firstName', 'lastName'];
    const filledFields = basicFields.filter(field => this[field]).length;
    const basicScore = (filledFields / basicFields.length) * 40; // 40 points for basic fields

    if (this.profilePicture) {
        score += 10; // 10 points for profile picture
    }

    score += basicScore;

    // Verification (50 points)
    if (this.verificationStatus === 'verified' && this.verificationDocuments && this.verificationDocuments.length > 0) {
        score += 50; // 50 points for verified with documents
    }

    this.trustScore = Math.min(Math.round(score), 100);
    return this.trustScore;
};

// Map _id to id for frontend compatibility
userSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
        delete ret.password; // Don't send password back
        delete ret.verificationToken;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
    }
});

module.exports = mongoose.model('User', userSchema);
