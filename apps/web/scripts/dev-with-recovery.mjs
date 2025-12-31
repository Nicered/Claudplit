#!/usr/bin/env node

/**
 * Next.js dev server with automatic cache recovery
 * Detects cache corruption patterns and auto-recovers by clearing .next
 */

import { spawn } from 'child_process';
import { rm } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webDir = dirname(__dirname);
const nextDir = join(webDir, '.next');

const CORRUPTION_PATTERNS = [
  /Cannot find module '\.\/vendor-chunks\//,
  /ENOENT.*routes-manifest\.json/,
  /MODULE_NOT_FOUND.*\.next\//,
  /Cannot find module.*\.next\/server/,
];

let devProcess = null;
let isRecovering = false;

async function cleanCache() {
  console.log('\n🔧 Cache corruption detected! Auto-recovering...');
  console.log('   Deleting .next folder...');

  try {
    await rm(nextDir, { recursive: true, force: true });
    console.log('   Cache cleared successfully.');
  } catch (err) {
    console.error('   Failed to clear cache:', err.message);
  }
}

function startDevServer() {
  console.log('🚀 Starting Next.js dev server with auto-recovery...\n');

  const port = process.env.PORT || 13000;
  devProcess = spawn('pnpm', ['next', 'dev', '-p', port.toString()], {
    cwd: webDir,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
  });

  const checkForCorruption = (data) => {
    const output = data.toString();
    process.stdout.write(output);

    if (isRecovering) return;

    for (const pattern of CORRUPTION_PATTERNS) {
      if (pattern.test(output)) {
        isRecovering = true;
        handleCorruption();
        break;
      }
    }
  };

  devProcess.stdout.on('data', checkForCorruption);
  devProcess.stderr.on('data', checkForCorruption);

  devProcess.on('close', (code) => {
    if (!isRecovering) {
      console.log(`\nDev server exited with code ${code}`);
      process.exit(code);
    }
  });
}

async function handleCorruption() {
  if (devProcess) {
    devProcess.kill('SIGTERM');
    // Wait for process to terminate
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  await cleanCache();

  console.log('   Restarting dev server...\n');
  isRecovering = false;
  startDevServer();
}

// Handle SIGINT/SIGTERM gracefully
process.on('SIGINT', () => {
  if (devProcess) devProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (devProcess) devProcess.kill('SIGTERM');
  process.exit(0);
});

startDevServer();
