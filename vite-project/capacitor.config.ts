import type { CapacitorConfig } from '@capacitor/cli';
import { networkInterfaces } from 'os';

function getLocalIPAddress(): string {
  const interfaces = networkInterfaces();
  for (const interfaceName of Object.keys(interfaces)) {
    const addresses = interfaces[interfaceName];
    if (addresses) {
      for (const addr of addresses) {
        if (addr.family === 'IPv4' && !addr.internal) {
          return addr.address;
        }
      }
    }
  }
  return 'localhost';
}

const isLiveReload = process.env.CAPACITOR_LIVE_RELOAD === 'true';

const config: CapacitorConfig = {
  appId: 'com.buyto.app',
  appName: 'Buyto',
  webDir: 'dist',
  server: isLiveReload ? {
    url: `http://${getLocalIPAddress()}:5175`,
    cleartext: true
  } : undefined
};

export default config;
