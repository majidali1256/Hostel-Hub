const nodemailer = require('nodemailer');

// Configure email transporter
// For development, you can use Gmail or a service like Mailtrap
// For production, use a proper email service like SendGrid, AWS SES, etc.

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email - Hostel Hub',
        html: `
            <h1>Welcome to Hostel Hub!</h1>
            <p>Please verify your email address by clicking the link below:</p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
            <p>Or copy and paste this link in your browser:</p>
            <p>${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Verification email sent to:', email);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
};

const sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset - Hostel Hub',
        html: `
            <h1>Password Reset Request</h1>
            <p>You requested to reset your password. Click the link below to reset it:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>Or copy and paste this link in your browser:</p>
            <p>${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
        `
    };

    try {
        if (!process.env.EMAIL_USER) {
            console.log('=================================================');
            console.log('DEV MODE: Email credentials not found.');
            console.log(`To reset password for ${email}, click this link:`);
            console.log(resetUrl);
            console.log('=================================================');
            return;
        }
        await transporter.sendMail(mailOptions);
        console.log('Password reset email sent to:', email);
    } catch (error) {
        console.error('Error sending password reset email:', error);
        // Fallback for dev mode if sending fails
        console.log('=================================================');
        console.log('DEV MODE (Fallback): Email failed to send.');
        console.log(`To reset password for ${email}, click this link:`);
        console.log(resetUrl);
        console.log('=================================================');
    }
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,

    sendBookingRequestEmail: async (ownerEmail, ownerName, customerName, hostelName, checkIn, checkOut, totalPrice) => {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: ownerEmail,
            subject: `New Booking Request: ${hostelName}`,
            html: `
                <h1>New Booking Request!</h1>
                <p>Hello ${ownerName},</p>
                <p>You have received a new booking request from <strong>${customerName}</strong> for <strong>${hostelName}</strong>.</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Check-in:</strong> ${new Date(checkIn).toLocaleDateString()}</p>
                    <p><strong>Check-out:</strong> ${new Date(checkOut).toLocaleDateString()}</p>
                    <p><strong>Total Price:</strong> PKR ${totalPrice}</p>
                </div>
                <p>Please log in to your dashboard to accept or reject this request.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">View Booking</a>
            `
        };
        try {
            await transporter.sendMail(mailOptions);
            console.log('Booking request email sent to:', ownerEmail);
        } catch (error) {
            console.error('Error sending booking request email:', error);
        }
    },

    sendBookingConfirmationEmail: async (customerEmail, customerName, hostelName, checkIn, checkOut, bookingId) => {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: customerEmail,
            subject: `Booking Confirmed: ${hostelName}`,
            html: `
                <h1>Booking Confirmed! 🎉</h1>
                <p>Hello ${customerName},</p>
                <p>Great news! Your booking for <strong>${hostelName}</strong> has been accepted by the owner.</p>
                <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Booking ID:</strong> ${bookingId}</p>
                    <p><strong>Check-in:</strong> ${new Date(checkIn).toLocaleDateString()}</p>
                    <p><strong>Check-out:</strong> ${new Date(checkOut).toLocaleDateString()}</p>
                </div>
                <p>We wish you a pleasant stay!</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/bookings" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">View My Bookings</a>
            `
        };
        try {
            await transporter.sendMail(mailOptions);
            console.log('Booking confirmation email sent to:', customerEmail);
        } catch (error) {
            console.error('Error sending booking confirmation email:', error);
        }
    },

    sendBookingRejectionEmail: async (customerEmail, customerName, hostelName, reason) => {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: customerEmail,
            subject: `Update on your booking for ${hostelName}`,
            html: `
                <h1>Booking Update</h1>
                <p>Hello ${customerName},</p>
                <p>We regret to inform you that your booking request for <strong>${hostelName}</strong> could not be accepted at this time.</p>
                ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                <p>No payment has been deducted (or it will be refunded shortly).</p>
                <p>Please check other available hostels on our platform.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="display: inline-block; padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px;">Browse Hostels</a>
            `
        };
        try {
            await transporter.sendMail(mailOptions);
            console.log('Booking rejection email sent to:', customerEmail);
        } catch (error) {
            console.error('Error sending booking rejection email:', error);
        }
    }
};

// Appointment Email Notifications
const sendAppointmentRequestEmail = async (ownerEmail, ownerName, customerName, hostelName, appointmentData) => {
    const { scheduledTime, duration, type, notes } = appointmentData;
    const appointmentDate = new Date(scheduledTime).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short'
    });

    const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@hostelhub.com',
        to: ownerEmail,
        subject: `New Appointment Request for ${hostelName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">New Appointment Request</h2>
                <p>Hello ${ownerName},</p>
                <p><strong>${customerName}</strong> has requested to visit your property:</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Property:</strong> ${hostelName}</p>
                    <p><strong>Date & Time:</strong> ${appointmentDate}</p>
                    <p><strong>Duration:</strong> ${duration} minutes</p>
                    <p><strong>Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
                    ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
                </div>

                <p>Please log in to your dashboard to confirm or decline this appointment request.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Appointment</a>
                
                <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">This is an automated email. Please do not reply.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Appointment request email sent to:', ownerEmail);
    } catch (error) {
        console.error('Error sending appointment request email:', error);
    }
};

const sendAppointmentConfirmationEmail = async (customerEmail, customerName, ownerName, hostelName, appointmentData) => {
    const { scheduledTime, duration, notes } = appointmentData;
    const appointmentDate = new Date(scheduledTime).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short'
    });

    const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@hostelhub.com',
        to: customerEmail,
        subject: `Appointment Confirmed - ${hostelName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">Appointment Confirmed! ✓</h2>
                <p>Hello ${customerName},</p>
                <p>Great news! Your appointment has been confirmed by ${ownerName}.</p>
                
                <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                    <p><strong>Property:</strong> ${hostelName}</p>
                    <p><strong>Date & Time:</strong> ${appointmentDate}</p>
                    <p><strong>Duration:</strong> ${duration} minutes</p>
                    <p><strong>Owner:</strong> ${ownerName}</p>
                    ${notes ? `<p><strong>Your Notes:</strong> ${notes}</p>` : ''}
                </div>

                <p>Please arrive on time. If you need to cancel or reschedule, please do so at least 24 hours in advance.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Details</a>
                
                <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">This is an automated email. Please do not reply.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Appointment confirmation email sent to:', customerEmail);
    } catch (error) {
        console.error('Error sending appointment confirmation email:', error);
    }
};

const sendAppointmentCancellationEmail = async (recipientEmail, recipientName, hostelName, appointmentData, cancelledBy, reason) => {
    const { scheduledTime } = appointmentData;
    const appointmentDate = new Date(scheduledTime).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short'
    });

    const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@hostelhub.com',
        to: recipientEmail,
        subject: `Appointment Cancelled - ${hostelName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #ef4444;">Appointment Cancelled</h2>
                <p>Hello ${recipientName},</p>
                <p>The appointment for ${hostelName} has been cancelled.</p>
                
                <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <p><strong>Property:</strong> ${hostelName}</p>
                    <p><strong>Scheduled Date & Time:</strong> ${appointmentDate}</p>
                    <p><strong>Cancelled by:</strong> ${cancelledBy}</p>
                    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                </div>

                <p>If you'd like to reschedule, please visit the property page to request a new appointment.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="display: inline-block; padding: 12px 24px; background-color: #6b7280; color: white; text-decoration: none; border-radius: 6px; margin-top: 10px;">Browse Hostels</a>
                
                <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">This is an automated email. Please do not reply.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Appointment cancellation email sent to:', recipientEmail);
    } catch (error) {
        console.error('Error sending appointment cancellation email:', error);
    }
};
