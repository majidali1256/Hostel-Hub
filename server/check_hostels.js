require('dotenv').config();
const mongoose = require('mongoose');
const Hostel = require('./models/Hostel');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hostel-hub';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        const count = await Hostel.countDocuments();
        console.log(`Total Hostels: ${count}`);
        if (count > 0) {
            const hostels = await Hostel.find();
            const size = Buffer.byteLength(JSON.stringify(hostels));
            console.log(`Total size of all hostels (full payload): ${size / 1024 / 1024} MB`);

            // Check if slicing images helps
            const optimizedHostels = await Hostel.find({}, { images: { $slice: 1 } });
            const optimizedSize = Buffer.byteLength(JSON.stringify(optimizedHostels));
            console.log(`Total size with image slicing (first image only): ${optimizedSize / 1024 / 1024} MB`);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
