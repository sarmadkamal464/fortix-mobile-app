import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const SplashScreen1 = () => {
  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      const hasSeenSplash = await AsyncStorage.getItem("hasSeenSplash");
      const token = await SecureStore.getItemAsync("token");
      // If token exists, move directly to Live Monitoring
      if (!hasSeenSplash) {
        router.replace("/splash2");
        // Navigate to the first splash screen if it hasn't been seen
      } else if (token) {
        // If the token exists, navigate to Live Monitoring
        router.replace("/livemonitoring");
      } else {
        // Otherwise, navigate to the Login screen
        router.replace("/login");
      }
    };

    setTimeout(() => {
      checkToken();
    }, 1000); // Delay for 2 seconds before checking the token
  }, [router]);

  return (
    <View style={styles.container}>
      <Image
        source={require("./../../assets/images/logo.png")} // Replace with your logo
        style={styles.logo}
      />
    </View>
  );
};

export default SplashScreen1;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff", // Set your desired background color
    width: "100%",
    paddingHorizontal: 20,
  },
  logo: {
    width: "100%",
    resizeMode: "contain",
  },
});
