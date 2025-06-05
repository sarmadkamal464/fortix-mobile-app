import { Stack } from "expo-router";

export default function RootLayout() {
<<<<<<< Updated upstream
  return <Stack />;
=======
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const [appIsReady, setAppIsReady] = useState(false);
  const [modalVisible, setModalVisible] = useState(true);
  const [popupData, setPopupData] = useState<{
    title?: string | null;
    body?: string | null;
    imageUrls?: string[];
  }>({});

  const showPopup = (notification: Notifications.Notification) => {
    const { title, body, data } = notification.request.content;
    let imageUrls: string[] = [];

    // Try to get image_urls directly
    if (Array.isArray((data as any).image_urls)) {
      imageUrls = (data as any).image_urls;
    } else if (typeof (data as any).body === 'string') {
      // Try to parse image_urls from JSON string in body
      try {
        const bodyObj = JSON.parse((data as any).body);
        if (Array.isArray(bodyObj.image_urls)) {
          imageUrls = bodyObj.image_urls;
        }
      } catch {}
    }
    setPopupData({ title, body, imageUrls });
    setModalVisible(true);
  };

  // Add effect to monitor modal state changes
  useEffect(() => {
    console.log("Modal visibility changed:", modalVisible);
  }, [modalVisible]);

  useEffect(() => {
    async function prepare() {
      try {
        // Simulate loading tasks (e.g., fonts, API, etc.)
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync(); // Hide splash screen
      }
    }

    prepare();

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

  if (!appIsReady) {
    return null; // Prevent UI rendering until app is ready
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
            imageUrls={popupData.imageUrls}
            title={popupData.title}
            body={popupData.body}
          />
        </ToastProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
>>>>>>> Stashed changes
}
