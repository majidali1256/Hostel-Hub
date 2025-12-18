/**
 * Script to create or update an admin user
 * Usage: node server/scripts/make-admin.js email@example.com
 */

require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hostel-hub';

const userSchema = new mongoose.Schema({
    username: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ['owner', 'customer', 'pending', 'admin'], default: 'pending' },
    authProvider: { type: String, default: 'local' },
    firstName: String,
    lastName: String,
    contactNumber: String,
    stayHistory: [String],
    profilePicture: String,
    trustScore: { type: Number, default: 50 },
    verificationDocuments: [String],
    emailVerified: { type: Boolean, default: false },
    verificationStatus: { type: String, default: 'unverified' },
    bankDetails: {
        bankName: String,
        accountTitle: String,
        accountNumber: String,
        iban: String,
        jazzCashNumber: String,
        easyPaisaNumber: String,
        verified: { type: Boolean, default: false }
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function makeAdmin() {
    const email = process.argv[2];

    if (!email) {
        console.log('\n📋 Usage: node server/scripts/make-admin.js <email>');
        console.log('\nExamples:');
        console.log('  node server/scripts/make-admin.js admin@hostelhub.com  - Make existing user admin');
        console.log('  node server/scripts/make-admin.js create               - Create default admin');
        console.log('\n');

        // Show existing users
        try {
            await mongoose.connect(MONGO_URI);
            const users = await User.find({}).select('email role').limit(10);
            console.log('📧 Existing users:');
            users.forEach(u => console.log(`   - ${u.email} (${u.role})`));
            console.log('\n');
        } catch (err) {
            console.error('Could not connect to database:', err.message);
        }
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        if (email === 'create') {
            // Create default admin user
            const adminEmail = 'admin@hostelhub.com';
            const adminPassword = 'Admin123!';

            let adminUser = await User.findOne({ email: adminEmail });

            if (adminUser) {
                adminUser.role = 'admin';
                await adminUser.save();
                console.log(`\n✅ Updated existing user to admin: ${adminEmail}`);
            } else {
                const hashedPassword = await bcrypt.hash(adminPassword, 12);
                adminUser = new User({
                    username: 'Admin',
                    email: adminEmail,
                    password: hashedPassword,
                    role: 'admin',
                    firstName: 'Admin',
                    lastName: 'User',
                    emailVerified: true,
                    verificationStatus: 'verified',
                    trustScore: 100
                });
                await adminUser.save();
                console.log(`\n✅ Created new admin user: ${adminEmail}`);
            }

            console.log('\n📝 Admin Login Credentials:');
            console.log(`   Email: ${adminEmail}`);
            console.log(`   Password: ${adminPassword}`);
        } else {
            // Update existing user to admin
            const user = await User.findOne({ email: email });

            if (!user) {
                console.log(`\n❌ User not found: ${email}`);
                const users = await User.find({}).select('email role').limit(10);
                console.log('\n📧 Available users:');
                users.forEach(u => console.log(`   - ${u.email} (${u.role})`));
                process.exit(1);
            }

            user.role = 'admin';
            await user.save();
            console.log(`\n✅ User ${email} is now an admin!`);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

makeAdmin();
