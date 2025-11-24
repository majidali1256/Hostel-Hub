const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
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
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    scheduledTime: {
        type: Date,
        required: true
    },
    duration: {
        type: Number,
        default: 30, // minutes
        min: 15,
        max: 180
    },
    type: {
        type: String,
        enum: ['viewing', 'consultation', 'other'],
        default: 'viewing'
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    notes: {
        type: String,
        maxlength: 500
    },
    location: String,
    meetingLink: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    confirmedAt: Date,
    cancelledAt: Date,
    cancelReason: String
});

// Index for efficient queries
appointmentSchema.index({ customerId: 1, scheduledTime: 1 });
appointmentSchema.index({ ownerId: 1, scheduledTime: 1 });
appointmentSchema.index({ hostelId: 1, status: 1 });

// Virtual for end time
appointmentSchema.virtual('endTime').get(function () {
    return new Date(this.scheduledTime.getTime() + this.duration * 60000);
});

// Method to check if appointment conflicts with another
appointmentSchema.methods.conflictsWith = function (otherAppointment) {
    const thisEnd = this.endTime;
    const otherEnd = otherAppointment.endTime;

    return (
        this.scheduledTime < otherEnd &&
        thisEnd > otherAppointment.scheduledTime
    );
};

module.exports = mongoose.model('Appointment', appointmentSchema);
