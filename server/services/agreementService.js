const Agreement = require('../models/Agreement');
const AgreementTemplate = require('../models/AgreementTemplate');
const Signature = require('../models/Signature');
const Booking = require('../models/Booking');
const Hostel = require('../models/Hostel');
const User = require('../models/User');

class AgreementService {
    /**
     * Create a new agreement from a template
     */
    static async createAgreement(bookingId, templateId, createdBy) {
        const booking = await Booking.findById(bookingId).populate('hostelId customerId');
        if (!booking) throw new Error('Booking not found');

        const template = await AgreementTemplate.findById(templateId);
        if (!template) throw new Error('Template not found');

        const hostel = await Hostel.findById(booking.hostelId);
        const tenant = await User.findById(booking.customerId);
        const landlord = await User.findById(hostel.ownerId);

        // Prepare data for variable substitution
        const data = {
            tenantName: `${tenant.firstName} ${tenant.lastName}`,
            landlordName: `${landlord.firstName} ${landlord.lastName}`,
            hostelName: hostel.name,
            hostelAddress: `${hostel.location.address}, ${hostel.location.city}`,
            rentAmount: booking.totalAmount, // Simplified
            deposit: booking.totalAmount * 0.5, // Example logic
            startDate: booking.checkInDate.toLocaleDateString(),
            endDate: booking.checkOutDate.toLocaleDateString(),
            duration: Math.ceil((booking.checkOutDate - booking.checkInDate) / (1000 * 60 * 60 * 24)) + ' days',
            currentDate: new Date().toLocaleDateString()
        };

        // Generate content from template
        const generated = template.generateAgreement(data);

        // Create agreement
        const agreement = new Agreement({
            bookingId,
            hostelId: hostel._id,
            landlordId: landlord._id,
            tenantId: tenant._id,
            ...generated,
            duration: {
                startDate: booking.checkInDate,
                endDate: booking.checkOutDate
            },
            rentAmount: booking.totalAmount,
            deposit: booking.totalAmount * 0.5,
            createdBy
        });

        await agreement.save();
        return agreement;
    }

    /**
     * Sign an agreement
     */
    static async signAgreement(agreementId, userId, signatureData, ipAddress, userAgent) {
        const agreement = await Agreement.findById(agreementId);
        if (!agreement) throw new Error('Agreement not found');

        if (agreement.status !== 'pending' && agreement.status !== 'draft') {
            throw new Error('Agreement cannot be signed in current status');
        }

        // Determine role
        let role;
        if (userId.toString() === agreement.landlordId.toString()) role = 'landlord';
        else if (userId.toString() === agreement.tenantId.toString()) role = 'tenant';
        else throw new Error('User is not a party to this agreement');

        // Create signature record
        const signature = new Signature({
            agreementId,
            userId,
            signatureData: signatureData.data,
            signatureType: signatureData.type,
            ipAddress,
            userAgent,
            verified: true // Simplified for demo
        });

        await signature.save();

        // Add to agreement
        await agreement.addSignature(userId, signature._id, role);

        // If fully signed, activate
        if (agreement.status === 'signed') {
            // In a real app, you might want manual activation or automated
            await agreement.activate();
        }

        return agreement;
    }

    /**
     * Get user's agreements
     */
    static async getUserAgreements(userId, role) {
        const query = {};
        if (role === 'landlord') query.landlordId = userId;
        else if (role === 'tenant') query.tenantId = userId;
        else query.$or = [{ landlordId: userId }, { tenantId: userId }];

        return Agreement.find(query)
            .populate('hostelId', 'name')
            .populate('tenantId', 'firstName lastName')
            .populate('landlordId', 'firstName lastName')
            .sort({ createdAt: -1 });
    }

    /**
     * Create a custom template
     */
    static async createTemplate(data, userId) {
        const template = new AgreementTemplate({
            ...data,
            createdBy: userId
        });
        return template.save();
    }

    /**
     * Terminate an agreement
     */
    static async terminateAgreement(agreementId, userId, reason) {
        const agreement = await Agreement.findById(agreementId);
        if (!agreement) throw new Error('Agreement not found');

        // Verify authority
        if (userId.toString() !== agreement.landlordId.toString() &&
            userId.toString() !== agreement.tenantId.toString()) {
            throw new Error('Unauthorized');
        }

        return agreement.terminate(reason);
    }
}

module.exports = AgreementService;
