// lib/cache.js

import NodeCache from 'node-cache';

// Initialize cache with a default TTL (time-to-live) of 1 hour (3600 seconds)
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

export default cache;
