const AdminLog = require('../models/AdminLog');
const Report = require('../models/Report');
const SystemSetting = require('../models/SystemSetting');
const User = require('../models/User');
const Hostel = require('../models/Hostel');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

class AdminService {
    /**
     * Get dashboard statistics
     */
    static async getDashboardStats() {
        const [
            totalUsers,
            totalHostels,
            totalBookings,
            pendingReports,
            revenue
        ] = await Promise.all([
            User.countDocuments(),
            Hostel.countDocuments(),
            Booking.countDocuments(),
            Report.countDocuments({ status: 'pending' }),
            Booking.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ])
        ]);

        return {
            users: totalUsers,
            hostels: totalHostels,
            bookings: totalBookings,
            pendingReports,
            totalRevenue: revenue[0]?.total || 0
        };
    }

    /**
     * Get users with filtering and pagination
     */
    static async getUsers(filters = {}, page = 1, limit = 20) {
        const query = {};
        if (filters.search) {
            query.$or = [
                { email: new RegExp(filters.search, 'i') },
                { firstName: new RegExp(filters.search, 'i') },
                { lastName: new RegExp(filters.search, 'i') }
            ];
        }
        if (filters.role) query.role = filters.role;
        if (filters.status) {
            if (filters.status === 'banned') query.isBanned = true;
            else if (filters.status === 'active') query.isBanned = false;
        }

        const users = await User.find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        return {
            users,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Perform action on user (ban, unban, verify)
     */
    static async performUserAction(adminId, userId, action, reason, ipAddress) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        let details = {};

        switch (action) {
            case 'ban':
                user.isBanned = true;
                details = { action: 'ban' };
                break;
            case 'unban':
                user.isBanned = false;
                details = { action: 'unban' };
                break;
            case 'verify':
                user.isVerified = true;
                details = { action: 'verify' };
                break;
            default:
                throw new Error('Invalid action');
        }

        await user.save();

        // Log action
        await AdminLog.logAction(
            adminId,
            `user_${action}`,
            userId,
            'User',
            details,
            ipAddress,
            reason
        );

        return user;
    }

    /**
     * Get reports
     */
    static async getReports(status = 'pending', page = 1, limit = 20) {
        const query = status === 'all' ? {} : { status };

        const reports = await Report.find(query)
            .populate('reporterId', 'firstName lastName email')
            .populate('assignedTo', 'firstName lastName')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: 1 }); // Oldest first for pending

        const total = await Report.countDocuments(query);

        return {
            reports,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Resolve report
     */
    static async resolveReport(adminId, reportId, resolution, note, ipAddress) {
        const report = await Report.findById(reportId);
        if (!report) throw new Error('Report not found');

        // Perform action based on resolution
        if (resolution === 'ban') {
            await this.performUserAction(adminId, report.targetId, 'ban', note, ipAddress);
        } else if (resolution === 'delete_content') {
            if (report.targetModel === 'Review') {
                await Review.findByIdAndDelete(report.targetId);
            } else if (report.targetModel === 'Hostel') {
                await Hostel.findByIdAndDelete(report.targetId);
            }
        }

        await report.resolve(adminId, resolution, note);

        // Log action
        await AdminLog.logAction(
            adminId,
            'resolve_report',
            reportId,
            'Report',
            { resolution, note },
            ipAddress,
            note
        );

        return report;
    }

    /**
     * Get system settings
     */
    static async getSettings() {
        return SystemSetting.find().sort({ group: 1, key: 1 });
    }

    /**
     * Update system setting
     */
    static async updateSetting(adminId, key, value, ipAddress) {
        const setting = await SystemSetting.findOne({ key });
        if (!setting) throw new Error('Setting not found');

        const oldValue = setting.value;
        setting.value = value;
        setting.lastUpdatedBy = adminId;
        await setting.save();

        // Log action
        await AdminLog.logAction(
            adminId,
            'update_setting',
            setting._id,
            'SystemSetting',
            { key, oldValue, newValue: value },
            ipAddress
        );

        return setting;
    }
}

module.exports = AdminService;
