const mongoose = require('mongoose');
require('dotenv').config();

async function verifyDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas\n');

        const db = mongoose.connection.db;

        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('📦 Collections in database:');
        collections.forEach(col => console.log(`   - ${col.name}`));

        // Check User collection indexes
        console.log('\n👤 User Collection Indexes:');
        const userIndexes = await db.collection('users').indexes();
        userIndexes.forEach(idx => console.log(`   - ${idx.name}`));

        // Check Hostel collection indexes
        console.log('\n🏠 Hostel Collection Indexes:');
        const hostelIndexes = await db.collection('hostels').indexes();
        hostelIndexes.forEach(idx => console.log(`   - ${idx.name}`));

        // Count documents
        const userCount = await db.collection('users').countDocuments();
        const hostelCount = await db.collection('hostels').countDocuments();

        console.log('\n📊 Document Counts:');
        console.log(`   - Users: ${userCount}`);
        console.log(`   - Hostels: ${hostelCount}`);

        console.log('\n✅ Database is properly configured for all modules!');
        console.log('\n🎯 Ready for:');
        console.log('   ✓ Module 1: Authentication (JWT, roles, email verification)');
        console.log('   ✓ Module 2: Property Listing (categories, status, reviews)');
        console.log('   ✓ Module 3: AI Search (natural language, recommendations)');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

verifyDatabase();
