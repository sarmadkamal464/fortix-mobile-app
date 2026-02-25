// lib/hooks/usePushToken.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useEffect, useState } from "react";
import { Alert, Linking, Platform } from "react-native";

export function usePushToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(setToken);
  }, []);

  return token;
}

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Push notification permission not granted");
    Alert.alert('Notification Permission', 'Please enable notification permission for receiving violation alerts',[
      {
        text: 'OK',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: () => {
          Linking.openSettings();
        },
      },
    ]);
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}
