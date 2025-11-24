const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function setupDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;

        // Create indexes for User collection
        console.log('\n📊 Setting up User collection indexes...');
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ username: 1 });
        await db.collection('users').createIndex({ role: 1 });
        await db.collection('users').createIndex({ emailVerified: 1 });
        console.log('✅ User indexes created');

        // Create indexes for Hostel collection
        console.log('\n📊 Setting up Hostel collection indexes...');
        await db.collection('hostels').createIndex({ ownerId: 1 });
        await db.collection('hostels').createIndex({ category: 1 });
        await db.collection('hostels').createIndex({ status: 1 });
        await db.collection('hostels').createIndex({ genderPreference: 1 });
        await db.collection('hostels').createIndex({ price: 1 });
        await db.collection('hostels').createIndex({ rating: -1 });
        await db.collection('hostels').createIndex({ location: 'text', name: 'text', description: 'text' });
        await db.collection('hostels').createIndex({ amenities: 1 });
        console.log('✅ Hostel indexes created');

        // Display collection stats
        console.log('\n📈 Database Statistics:');
        const collections = await db.listCollections().toArray();

        for (const collection of collections) {
            const stats = await db.collection(collection.name).stats();
            console.log(`\n${collection.name}:`);
            console.log(`  - Documents: ${stats.count}`);
            console.log(`  - Size: ${(stats.size / 1024).toFixed(2)} KB`);
            console.log(`  - Indexes: ${stats.nindexes}`);
        }

        console.log('\n✅ Database setup complete!');
        console.log('\n📋 Summary:');
        console.log('  - User collection: Indexed for email, username, role, verification');
        console.log('  - Hostel collection: Indexed for search, filtering, and sorting');
        console.log('  - Text search enabled for location, name, and description');
        console.log('\n🎉 All modules are ready to use!');

    } catch (error) {
        console.error('❌ Error setting up database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Connection closed');
    }
}

setupDatabase();
