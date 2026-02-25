import React, { useEffect, useRef, useState, useCallback } from "react";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { ToastProvider } from "@/lib/utils/toast";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, useRouter } from "expo-router";
import NotificationModal from "@/components/NotificationModel";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AnimatedSplashScreen from "@/components/AnimatedSplashScreen";
import { Platform } from "react-native";

// Prevent splash from auto-hiding
SplashScreen.preventAutoHideAsync();
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// Configure notification channel for Android
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

export default function RootLayout() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [appIsReady, setAppIsReady] = useState(false);
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);
  const [popupData, setPopupData] = useState<{
    title?: string | null;
    body?: string | null;
    imageUrl?: string;
    alert_id?: string;
  }>({});

  const showPopup = (notification: Notifications.Notification) => {
    const { title, body, data } = notification.request.content;
    const imageUrl = (data as any).image_url;
    const alert_id = (data as any).alert_id;
    setPopupData({ title, body, imageUrl, alert_id });
    setModalVisible(true);
  };

  // Add effect to monitor modal state changes
  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        // For now, we simulate a small delay or just wait for the layout to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();

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

    (async () => {
      const lastNotificationResponse =
        await Notifications.getLastNotificationResponseAsync();
      if (lastNotificationResponse) {
        await router.push(`/alertdetails?id=${lastNotificationResponse.notification.request.content.data.alert_id}`)
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

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  if (!splashAnimationFinished) {
    return (
      <AnimatedSplashScreen
        onAnimationFinish={() => {
          setSplashAnimationFinished(true);
        }}
      />
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ToastProvider>
          <Stack
            screenOptions={{
              headerShown: false,

              animation: "fade_from_bottom",
            }}
          />
          <NotificationModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            imageUrl={popupData.imageUrl}
            title={popupData.title}
            body={popupData.body}
            alert_id={popupData.alert_id}
          />
        </ToastProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}