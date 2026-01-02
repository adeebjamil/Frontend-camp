const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Create a cache directory if it doesn't exist
const cacheDir = path.join(process.cwd(), '.next/cache/fetch-cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

module.exports = class SimpleCache {
  constructor(options) {
    this.options = options;
    this.ttl = options?.ttl || 60; // 60 seconds default
  }

  async get(key) {
    try {
      const hash = this.hashKey(key);
      const cacheFile = path.join(cacheDir, hash);
      
      if (fs.existsSync(cacheFile)) {
        const content = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        if (content.expiry > Date.now()) {
          return { value: content.value };
        }
      }
    } catch (e) {
      console.error('Cache error:', e);
    }
    return null;
  }

  async set(key, value, ttl = this.ttl) {
    try {
      const hash = this.hashKey(key);
      const cacheFile = path.join(cacheDir, hash);
      
      fs.writeFileSync(cacheFile, JSON.stringify({
        expiry: Date.now() + (ttl * 1000),
        value
      }));
    } catch (e) {
      console.error('Cache set error:', e);
    }
  }

  hashKey(key) {
    return crypto.createHash('md5').update(key).digest('hex');
  }
}