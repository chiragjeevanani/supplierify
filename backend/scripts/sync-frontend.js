import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDist = path.resolve(__dirname, '../../frontend/dist');
const backendPublic = path.resolve(__dirname, '../public');

if (!fs.existsSync(frontendDist) && fs.existsSync(path.join(backendPublic, 'index.html'))) {
  // Hosting panels often run this as the build command with only the backend folder checked out.
  // The built site is committed in backend/public, so there is nothing to copy.
  console.log('ℹ️ frontend/dist not found; using the committed build in backend/public.');
  process.exit(0);
}

if (!fs.existsSync(frontendDist)) {
  console.error('❌ Error: frontend/dist not found! Please run "npm run build" in frontend directory first.');
  process.exit(1);
}

if (!fs.existsSync(backendPublic)) {
  fs.mkdirSync(backendPublic, { recursive: true });
}

// Remove previously synced bundles so old hashed files do not pile up
fs.rmSync(path.join(backendPublic, 'assets'), { recursive: true, force: true });

fs.cpSync(frontendDist, backendPublic, { recursive: true, force: true });
console.log('✅ Successfully copied frontend/dist to backend/public!');
console.log('📁 Backend public folder is now ready to commit and push.');
