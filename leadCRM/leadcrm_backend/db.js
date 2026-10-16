const mongoose = require('mongoose');

// Connection is cached on `global` so serverless invocations (Vercel) reuse it instead of reconnecting every request.
const cache = global.__leadcrmMongo || (global.__leadcrmMongo = { promise: null });

const connectDb = async () => {
    if (mongoose.connection.readyState === 1) return mongoose.connection;
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
    // readyState 0 = disconnected: a cached (already resolved) promise is stale, so connect again.
    if (!cache.promise || mongoose.connection.readyState === 0) {
        cache.promise = mongoose
            .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000, bufferCommands: false, maxPoolSize: 5 })
            .catch((err) => {
                cache.promise = null;
                throw err;
            });
    }
    await cache.promise;
    return mongoose.connection;
};

module.exports = { connectDb };
