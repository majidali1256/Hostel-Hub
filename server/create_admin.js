const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGODB_URI = 'mongodb://127.0.0.1:27017/hostel-hub';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@hostelhub.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('Admin user already exists');
            existingAdmin.role = 'admin';
            await existingAdmin.save();
            console.log('Updated existing user to admin');
        } else {
            const newAdmin = new User({
                username: 'admin',
                email: adminEmail,
                password: 'adminpassword123', // Will be hashed
                role: 'admin',
                firstName: 'System',
                lastName: 'Admin',
                emailVerified: true
            });
            await newAdmin.save();
            console.log('Created new admin user');
        }

        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
