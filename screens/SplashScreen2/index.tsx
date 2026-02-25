import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const SplashScreen2 = () => {
  const router = useRouter();

  const handleSkip = async () => {
    await AsyncStorage.setItem("hasSeenSplash", "true"); // Mark splash as seen
    router.push("/login"); // Navigate to the login screen
  };

  const handleContinue = async () => {
    await AsyncStorage.setItem("hasSeenSplash", "true"); // Mark splash as seen
    router.push("/login"); // Navigate to the login screen
  };

  return (
    <View style={styles.container}>
      {/* Top Section */}
      <View style={styles.topContainer}>
        <Image
          source={require("../../assets/images/logo.png")} // Replace with your logo
          style={styles.logo}
        />
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Ionicons name="close-outline" size={24} color="#000" />
          {/* <Text style={styles.skipText}>Skip</Text> */}
        </TouchableOpacity>
      </View>

      {/* Middle Section */}
      <View style={styles.middleContainer}>
        <Image
          source={require("../../assets/images/splashScreenCamera.png")} // Replace with your image
          style={styles.mainImage}
        />
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        <Text style={styles.title}> Fortix empowers smarter detection</Text>
        <Text style={styles.description}>
        Our AI-powered software optimizes surveillance and adapts to
        specialized needs.
        </Text>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SplashScreen2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 5,
    paddingTop: Platform.OS === "ios" ? 30 : 0,
    backgroundColor: "#fff",
  },
  topContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  logo: {
    width: 120,
    height: 30,
    resizeMode: "contain",
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  skipText: {
    fontSize: 16,
    color: "#000",
    marginLeft: 4,
  },
  middleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mainImage: {
    width: 316.72,
    height: 417.4,
    resizeMode: "contain",
  },
  bottomContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  title: {
    width: 258,
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#111727",
    textAlign: "center",
  },
  description: {
    width: 229,
    fontSize: 14,
    color: "#2F7780",
    textAlign: "center",
    marginBottom: 24,
  },
  continueButton: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
