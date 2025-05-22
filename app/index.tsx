// app/auth-loading.tsx
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function AuthLoading() {
  SplashScreen.preventAutoHideAsync();
  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      const hasSeenSplash = await AsyncStorage.getItem("hasSeenSplash");
      const token = await SecureStore.getItemAsync("token");
      // If token exists, move directly to Live Monitoring
      if (!hasSeenSplash) {
        router.replace("/splash1");
        // Navigate to the first splash screen if it hasn't been seen
      } else if (token) {
        // If the token exists, navigate to Live Monitoring
        router.replace("/livemonitoring");
      } else {
        // Otherwise, navigate to the Login screen
        router.replace("/login");
      }
    };

    checkToken();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
