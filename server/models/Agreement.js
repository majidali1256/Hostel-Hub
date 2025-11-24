const mongoose = require('mongoose');

const agreementSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    hostelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hostel',
        required: true
    },
    landlordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['lease', 'rental', 'sublease', 'rules'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AgreementTemplate'
    },
    terms: [{
        title: String,
        content: String,
        required: { type: Boolean, default: true }
    }],
    duration: {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true }
    },
    rentAmount: {
        type: Number,
        required: true
    },
    deposit: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['draft', 'pending', 'signed', 'active', 'expired', 'terminated'],
        default: 'draft'
    },
    signatures: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['landlord', 'tenant'] },
        signatureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Signature' },
        signedAt: { type: Date, default: Date.now }
    }],
    metadata: {
        utilities: [String],
        rules: [String],
        paymentMethod: String,
        lateFeePolicy: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    version: {
        type: Number,
        default: 1
    },
    parentAgreementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agreement'
    },
    expiresAt: Date,
    signedAt: Date,
    terminatedAt: Date,
    terminationReason: String
}, {
    timestamps: true
});

// Indexes
agreementSchema.index({ tenantId: 1, status: 1 });
agreementSchema.index({ landlordId: 1, status: 1 });
agreementSchema.index({ bookingId: 1 });

// Methods
agreementSchema.methods.addSignature = async function (userId, signatureId, role) {
    // Check if already signed
    const existingSignature = this.signatures.find(s => s.userId.toString() === userId.toString());
    if (existingSignature) {
        throw new Error('User already signed this agreement');
    }

    this.signatures.push({
        userId,
        role,
        signatureId,
        signedAt: new Date()
    });

    // Check if fully signed
    if (this.isFullySigned()) {
        this.status = 'signed';
        this.signedAt = new Date();
    }

    return this.save();
};

agreementSchema.methods.isFullySigned = function () {
    const hasLandlordSignature = this.signatures.some(s => s.role === 'landlord');
    const hasTenantSignature = this.signatures.some(s => s.role === 'tenant');
    return hasLandlordSignature && hasTenantSignature;
};

agreementSchema.methods.activate = async function () {
    if (this.status !== 'signed') {
        throw new Error('Agreement must be signed before activation');
    }
    this.status = 'active';
    return this.save();
};

agreementSchema.methods.terminate = async function (reason) {
    this.status = 'terminated';
    this.terminatedAt = new Date();
    this.terminationReason = reason;
    return this.save();
};

module.exports = mongoose.model('Agreement', agreementSchema);
