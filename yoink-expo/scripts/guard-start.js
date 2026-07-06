#!/usr/bin/env node

const net = require('node:net');

const expectedExpoPort = 8084;
const expectedWebPort = '5173';
const checkOnly = process.argv.includes('--check-only');
const webUrl = process.env.EXPO_PUBLIC_YOINK_URL;

function fail(message) {
  console.error(`Yoink Expo preflight failed: ${message}`);
  process.exit(1);
}

function validateWebUrl() {
  if (!webUrl) {
    fail('EXPO_PUBLIC_YOINK_URL is required. Example: EXPO_PUBLIC_YOINK_URL=http://192.168.1.162:5173 npm run start');
  }

  let parsed;
  try {
    parsed = new URL(webUrl);
  } catch {
    fail(`EXPO_PUBLIC_YOINK_URL is not a valid URL: ${webUrl}`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    fail('EXPO_PUBLIC_YOINK_URL must start with http:// or https://');
  }

  if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(parsed.hostname)) {
    fail('Use the Mac LAN IP for Expo Go, not localhost or 127.0.0.1.');
  }

  if (parsed.port !== expectedWebPort) {
    fail(`EXPO_PUBLIC_YOINK_URL must point to the Vite web server on port ${expectedWebPort}.`);
  }
}

function assertExpoPortFree() {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        fail(`Expo port ${expectedExpoPort} is already in use. Stop the old Metro server before starting a new one.`);
      }
      fail(`Could not check Expo port ${expectedExpoPort}: ${error.message}`);
    });

    server.once('listening', () => {
      server.close(resolve);
    });

    server.listen(expectedExpoPort, '0.0.0.0');
  });
}

async function main() {
  validateWebUrl();
  await assertExpoPortFree();

  const mode = checkOnly ? 'check' : 'start';
  console.log(`Yoink Expo ${mode} preflight OK: ${webUrl} -> Expo port ${expectedExpoPort}`);
}

main().catch((error) => fail(error.message));
