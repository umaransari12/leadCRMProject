// Local development only: runs the API on http://localhost:5000 against a throwaway in-memory MongoDB, so the UI can
// be tried (and test accounts created) without touching Atlas. All data is lost when the process stops.
//   npm run dev:memory
const crypto = require('node:crypto');
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
    const mongod = await MongoMemoryServer.create();
    process.env.MONGO_URI = `${mongod.getUri()}leadcrm_local`;
    process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex');
    process.env.AUTH_RATE_LIMIT_MAX = process.env.AUTH_RATE_LIMIT_MAX || '1000';
    delete process.env.LOCAL_DNS_SERVERS; // not needed: the database is local

    const app = require('../app');
    const port = process.env.PORT || 5000;
    const server = app.listen(port, () => console.log(`[dev:memory] API on http://localhost:${port} (in-memory database)`));

    const stop = async () => {
        server.close();
        await mongod.stop();
        process.exit(0);
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
})();
