// hooks/usePushToken.ts
import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

export const usePushToken = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    const registerForPushNotifications = async () => {
      try {
        if (!Device.isDevice) {
          console.log("Not a physical device. Push notifications won't work.");
          return;
        }

        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        console.log("Existing permission status:", existingStatus);

        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
          console.log("New permission status after request:", finalStatus);
        }

        if (finalStatus !== "granted") {
          console.log("Permission not granted for notifications");
          return;
        }

        const tokenResponse = await Notifications.getExpoPushTokenAsync();

        setExpoPushToken(tokenResponse.data);
      } catch (err) {
        console.error("Failed to register for push notifications:", err);
      }
    };

    registerForPushNotifications();
  }, []);

  return expoPushToken;
};
