// Local / persistent-host entry point. (On Vercel the app is served by ../api/index.js instead.)
require('dotenv').config({ quiet: true });

// Opt-in, local-development-only DNS workaround. Node's resolver can fall back to 127.0.0.1 on some machines,
// which breaks mongodb+srv:// lookups (querySrv ECONNREFUSED). Set LOCAL_DNS_SERVERS in your local .env to enable;
// remove it to disable. This file is not used on Vercel, and nothing happens when the variable is unset.
if (process.env.LOCAL_DNS_SERVERS) {
    const servers = process.env.LOCAL_DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean);
    require('dns').setServers(servers);
    console.log(`[dev] Node DNS servers overridden via LOCAL_DNS_SERVERS: ${servers.join(', ')}`);
}

const app = require('./app');
const { connectDb } = require('./db');

connectDb()
    .then(() => console.log('MongoDB Cloud Database connected successfully!'))
    .catch((err) => console.error('Database connection error:', err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});
