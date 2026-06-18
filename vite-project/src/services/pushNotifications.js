import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

let fcmToken = localStorage.getItem('fcm_token') || null;

/**
 * Request permission for push notifications.
 * @returns {Promise<boolean>} True if permission is granted, false otherwise.
 */
export const requestPermissions = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Push Service] Permissions requested, but not on a native platform.');
    return false;
  }
  try {
    const permission = await PushNotifications.requestPermissions();
    console.log('[Push Service] Permission status:', permission.receive);
    return permission.receive === 'granted';
  } catch (err) {
    console.error('[Push Service] Error requesting push notification permissions:', err);
    return false;
  }
};

/**
 * Register the device for push notifications.
 */
export const registerDevice = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Push Service] Registration requested, but not on a native platform.');
    return;
  }
  try {
    await PushNotifications.register();
    console.log('[Push Service] PushNotifications.register() called.');
  } catch (err) {
    console.error('[Push Service] Error registering device for push notifications:', err);
  }
};

/**
 * Get the cached FCM Token.
 * @returns {string|null} FCM Token or null.
 */
export const getFCMToken = () => {
  return fcmToken || localStorage.getItem('fcm_token');
};

/**
 * Set up listeners for registration, errors, incoming notifications, and clicks.
 * @param {Function} onTokenReceived - Callback with token string.
 * @param {Function} onNotificationReceived - Callback with notification payload.
 * @param {Function} onNotificationClick - Callback with action.notification payload.
 */
export const registerListeners = (onTokenReceived, onNotificationReceived, onNotificationClick) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Push Service] Listeners registered, but not on a native platform.');
    return;
  }

  // Handle successful registration and token retrieval
  PushNotifications.addListener('registration', (token) => {
    console.log('[Push Service] Registration successful. Token:', token.value);
    fcmToken = token.value;
    localStorage.setItem('fcm_token', token.value);
    if (onTokenReceived) {
      onTokenReceived(token.value);
    }
  });

  // Handle registration errors
  PushNotifications.addListener('registrationError', (err) => {
    console.error('[Push Service] Registration error:', err.error);
  });

  // Handle notification received in foreground
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('[Push Service] Notification received in foreground:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // Handle notification click action (background/foreground)
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('[Push Service] Action performed on notification:', action);
    if (onNotificationClick) {
      onNotificationClick(action.notification);
    }
  });
};

export const initializePushNotifications = async () => {
  const granted = await requestPermissions();

  if (!granted) {
    console.log("Push Permission Denied");
    return;
  }

  registerListeners();
  await registerDevice();

  console.log("Push notifications initialized");
};
