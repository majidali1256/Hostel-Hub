const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    hostelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hostel'
    },
    type: {
        type: String,
        enum: ['direct', 'group'],
        default: 'direct'
    },
    lastMessage: {
        content: String,
        senderId: mongoose.Schema.Types.ObjectId,
        timestamp: Date
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: new Map()
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

// Update timestamp on save
conversationSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Method to check if user is participant
conversationSchema.methods.hasParticipant = function (userId) {
    return this.participants.some(p => p.toString() === userId.toString());
};

// Method to get other participant (for direct chats)
conversationSchema.methods.getOtherParticipant = function (userId) {
    return this.participants.find(p => p.toString() !== userId.toString());
};

module.exports = mongoose.model('Conversation', conversationSchema);
