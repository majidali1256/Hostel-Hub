const Notification = require('../models/Notification');
const NotificationPreferences = require('../models/NotificationPreferences');

class NotificationService {
    // Create a notification
    static async create(userId, type, title, message, data = {}, priority = 'medium', actionUrl = null) {
        try {
            const notification = await Notification.createNotification({
                userId,
                type,
                title,
                message,
                data,
                priority,
                actionUrl
            });
            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    // Booking notifications
    static async notifyBookingConfirmed(booking) {
        const hostel = await require('../models/Hostel').findById(booking.hostelId);
        await this.create(
            booking.customerId,
            'booking',
            'Booking Confirmed!',
            `Your booking at ${hostel.name} has been confirmed for ${booking.checkIn.toDateString()}.`,
            { bookingId: booking._id, hostelId: hostel._id },
            'high',
            `/bookings/${booking._id}`
        );
    }

    static async notifyBookingCancelled(booking, reason) {
        const hostel = await require('../models/Hostel').findById(booking.hostelId);
        await this.create(
            booking.customerId,
            'booking',
            'Booking Cancelled',
            `Your booking at ${hostel.name} has been cancelled. ${reason ? `Reason: ${reason}` : ''}`,
            { bookingId: booking._id, hostelId: hostel._id },
            'high',
            `/bookings/${booking._id}`
        );
    }

    static async notifyBookingReminder(booking) {
        const hostel = await require('../models/Hostel').findById(booking.hostelId);
        await this.create(
            booking.customerId,
            'booking',
            'Booking Reminder',
            `Your stay at ${hostel.name} starts tomorrow!`,
            { bookingId: booking._id, hostelId: hostel._id },
            'medium',
            `/bookings/${booking._id}`
        );
    }

    // Message notifications
    static async notifyNewMessage(message, recipientId) {
        const sender = await require('../models/User').findById(message.senderId);
        await this.create(
            recipientId,
            'message',
            'New Message',
            `${sender.firstName} ${sender.lastName} sent you a message: ${message.content.substring(0, 50)}...`,
            { messageId: message._id, conversationId: message.conversationId },
            'medium',
            `/messages/${message.conversationId}`
        );
    }

    // Review notifications
    static async notifyNewReview(review, ownerId) {
        const reviewer = await require('../models/User').findById(review.reviewerId);
        const hostel = await require('../models/Hostel').findById(review.hostelId);
        await this.create(
            ownerId,
            'review',
            'New Review Received',
            `${reviewer.firstName} left a ${review.rating}-star review for ${hostel.name}.`,
            { reviewId: review._id, hostelId: hostel._id },
            'medium',
            `/hostels/${hostel._id}/reviews`
        );
    }

    static async notifyReviewResponse(review) {
        await this.create(
            review.reviewerId,
            'review',
            'Review Response',
            `The owner responded to your review.`,
            { reviewId: review._id, hostelId: review.hostelId },
            'low',
            `/reviews/${review._id}`
        );
    }

    // Appointment notifications
    static async notifyAppointmentRequested(appointment, ownerId) {
        const customer = await require('../models/User').findById(appointment.customerId);
        const hostel = await require('../models/Hostel').findById(appointment.hostelId);
        await this.create(
            ownerId,
            'appointment',
            'New Appointment Request',
            `${customer.firstName} ${customer.lastName} requested a ${appointment.type} at ${hostel.name}.`,
            { appointmentId: appointment._id, hostelId: hostel._id },
            'high',
            `/appointments/${appointment._id}`
        );
    }

    static async notifyAppointmentConfirmed(appointment) {
        const hostel = await require('../models/Hostel').findById(appointment.hostelId);
        await this.create(
            appointment.customerId,
            'appointment',
            'Appointment Confirmed',
            `Your ${appointment.type} at ${hostel.name} has been confirmed for ${appointment.scheduledTime.toLocaleString()}.`,
            { appointmentId: appointment._id, hostelId: hostel._id },
            'high',
            `/appointments/${appointment._id}`
        );
    }

    static async notifyAppointmentReminder(appointment) {
        const hostel = await require('../models/Hostel').findById(appointment.hostelId);
        await this.create(
            appointment.customerId,
            'appointment',
            'Appointment Reminder',
            `Your ${appointment.type} at ${hostel.name} is in 1 hour!`,
            { appointmentId: appointment._id, hostelId: hostel._id },
            'high',
            `/appointments/${appointment._id}`
        );
    }

    // System notifications
    static async notifyAccountVerified(userId) {
        await this.create(
            userId,
            'system',
            'Account Verified!',
            'Your email has been verified. Welcome to Hostel Hub!',
            {},
            'low',
            '/profile'
        );
    }

    static async notifyTrustScoreUpdated(userId, newScore, oldScore) {
        const change = newScore - oldScore;
        const message = change > 0
            ? `Your trust score increased by ${change} points to ${newScore}!`
            : `Your trust score is now ${newScore}.`;

        await this.create(
            userId,
            'system',
            'Trust Score Updated',
            message,
            { newScore, oldScore },
            'low',
            '/profile'
        );
    }

    static async notifyBadgeEarned(userId, badge) {
        const badgeNames = {
            verified: 'Verified',
            superhost: 'Superhost',
            responsive: 'Responsive',
            reliable: 'Reliable',
            experienced: 'Experienced',
            'top-rated': 'Top Rated'
        };

        await this.create(
            userId,
            'system',
            'New Badge Earned!',
            `Congratulations! You've earned the ${badgeNames[badge]} badge.`,
            { badge },
            'medium',
            '/profile'
        );
    }

    // Payment notifications
    static async notifyPaymentReceived(booking, amount) {
        await this.create(
            booking.customerId,
            'payment',
            'Payment Received',
            `Your payment of $${amount} has been received.`,
            { bookingId: booking._id, amount },
            'high',
            `/bookings/${booking._id}`
        );
    }
}

module.exports = NotificationService;
