import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "@/lib/hooks/auth";

const TwoFAScreen = () => {
  const { verify2FA, loading } = useAuth();
  const [otp, setOtp] = useState("");

  const handleVerify = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter the OTP code.");
      return;
    }

    try {
      await verify2FA(otp);
    } catch (error) {
      Alert.alert("Error", "Invalid OTP. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Two-Factor Authentication</Text>
      <Text style={styles.description}>
        Enter the 2FA code sent to your registered email or phone.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter 2FA Code"
        placeholderTextColor="#aaa"
        keyboardType="numeric"
        value={otp}
        onChangeText={setOtp}
      />

      <TouchableOpacity
        style={[styles.button, { opacity: loading ? 0.5 : 1 }]}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default TwoFAScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    width: "100%",
    height: 48,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});