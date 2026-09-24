// Runs before `npm run dev`: on a fresh clone, create and seed the SQLite DB.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const db = path.join(__dirname, '..', 'prisma', 'dev.db');
if (!fs.existsSync(db)) {
  console.log('No database found — creating and seeding prisma/dev.db ...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  execSync('npx prisma db seed', { stdio: 'inherit' });
}
