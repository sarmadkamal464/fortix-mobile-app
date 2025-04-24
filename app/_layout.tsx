import React, { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { ToastProvider } from "@/lib/utils/toast";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import NotificationModal from "@/components/NotificationModel";
import { SafeAreaProvider } from "react-native-safe-area-context";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const [modalVisible, setModalVisible] = useState(false);
  const [popupData, setPopupData] = useState<{
    title?: string | null;
    body?: string | null;
    imageUrl?: string;
  }>({});

  const showPopup = (notification: Notifications.Notification) => {
    const { title, body, data } = notification.request.content;
    const imageUrl = (data as any).image_url;
    setPopupData({ title, body, imageUrl });
    setModalVisible(true);
  };

  useEffect(() => {
    // 1. Listen while app is running
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received in foreground:", notification);
        showPopup(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        showPopup(response.notification);
      });

    // 2. Check if app was launched from a notification when it was killed
    (async () => {
      const lastNotificationResponse =
        await Notifications.getLastNotificationResponseAsync();
      if (lastNotificationResponse) {
        showPopup(lastNotificationResponse.notification);
      }
    })();

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current!
      );
      Notifications.removeNotificationSubscription(responseListener.current!);
    };
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ToastProvider>
          <Stack />
          <NotificationModal
            //key={`-${popupData?.imageUrl}`} // 👈 force remount on changes
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            imageUrl={popupData.imageUrl}
            title={popupData.title}
            body={popupData.body}
          />
        </ToastProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
