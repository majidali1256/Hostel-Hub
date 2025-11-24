const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');

(async () => {
    try {
        console.log('Starting In-Memory MongoDB...');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        console.log('InMemory Mongo URI:', uri);
        process.env.MONGODB_URI = uri;

        // Set other required env vars if missing
        if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'dev-secret';
        if (!process.env.PORT) process.env.PORT = '5001';

        // Start the actual app
        console.log('Starting Backend Server...');
        require('./index.js');
    } catch (error) {
        console.error('Failed to start in-memory DB:', error);
        process.exit(1);
    }
})();
