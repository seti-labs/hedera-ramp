#!/usr/bin/env node

/**
 * Development script to start the app with HTTPS
 * This ensures HashPack extension compatibility
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Hedera Ramp Hub with HTTPS...');
console.log('📡 HashPack requires HTTPS for proper detection');
console.log('🔗 App will be available at: https://localhost:5173');
console.log('⚠️  You may need to accept the self-signed certificate');

// Start the dev server with HTTPS
const devProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  shell: true
});

devProcess.on('error', (error) => {
  console.error('❌ Failed to start dev server:', error);
  process.exit(1);
});

devProcess.on('close', (code) => {
  console.log(`📡 Dev server exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down dev server...');
  devProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down dev server...');
  devProcess.kill('SIGTERM');
});
