const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env');

console.log('Environment Check Script');

if (!fs.existsSync(envPath)) {
  console.error('.env file not found in project root.');
  process.exit(1);
}

const env = fs.readFileSync(envPath, 'utf8');
const values = Object.fromEntries(
  env
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').trim()];
    }),
);

const requiredKeys = [
  'DATABASE_URL',
  'JWT_SECRET',
  'VITE_API_URL',
  'PORT',
];

let failed = false;
for (const key of requiredKeys) {
  if (!values[key]) {
    console.error(`Missing required env variable: ${key}`);
    failed = true;
  } else {
    console.log(`${key} is set`);
  }
}

const missing = [];
if (!fs.existsSync(path.resolve(process.cwd(), 'backend', '.env'))) missing.push('backend/.env');
if (!fs.existsSync(path.resolve(process.cwd(), 'frontend', '.env'))) missing.push('frontend/.env');
if (missing.length > 0) {
  console.warn(`Recommended env files missing: ${missing.join(', ')}`);
}

if (failed) {
  console.error('Environment check FAILED.');
  process.exit(1);
}

console.log('Environment check passed.');
process.exit(0);
