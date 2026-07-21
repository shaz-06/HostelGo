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
  backgroundColor: '#ffffff',
  server: {
    allowNavigation: ["checkout.razorpay.com", "*.razorpay.com", "api.razorpay.com"],
    ...(isLiveReload ? {
      url: `http://${getLocalIPAddress()}:5175`,
      cleartext: true
    } : {})
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      launchShowDuration: 3000,
      backgroundColor: "#F7C600",
      androidSplashResourceName: "splash",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
