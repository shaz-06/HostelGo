import { PushNotifications } from '@capacitor/push-notifications';

export const initializePushNotifications = async () => {
    try {
        let permission = await PushNotifications.checkPermissions();

        if (permission.receive !== 'granted') {
            permission = await PushNotifications.requestPermissions();
        }

        if (permission.receive !== 'granted') {
            console.log("Notification permission denied");
            return;
        }

        await PushNotifications.register();

        PushNotifications.addListener('registration', async (token) => {
            console.log("FCM Token Received:", token.value);

            localStorage.setItem("fcmToken", token.value);

            // send token to backend
            const jwt = localStorage.getItem("token");

            await fetch(
                "https://api.buyto.co.in/api/users/fcm-token",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${jwt}`
                    },
                    body: JSON.stringify({
                        token: token.value
                    })
                }
            );
        });

        PushNotifications.addListener(
            'pushNotificationReceived',
            (notification) => {
                console.log(
                    "Notification Received:",
                    notification
                );
            }
        );

        PushNotifications.addListener(
            'pushNotificationActionPerformed',
            (notification) => {
                console.log(
                    "Notification Clicked:",
                    notification
                );
            }
        );

    } catch (error) {
        console.error(error);
    }
};