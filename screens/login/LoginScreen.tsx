import { useAuth } from "@/lib/hooks/auth";
import { usePushToken } from "@/lib/hooks/usePushToken";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";

const LoginScreen = () => {
  const { loading, require2FA, login: authLogin, verify2FA } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const device_token = usePushToken();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Please enter both username and password");
      return;
    }

    if (!device_token) {
      Alert.alert(
        "Push token not ready yet. Please wait a few seconds and try again."
      );
      return;
    }

    await authLogin({ username, password, device_token });
  };

  const handleVerify2FA = async () => {
    await verify2FA(otp);
  };

  const isLoginDisabled = !username || !password || !device_token;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {device_token === null && (
        <Text style={{ color: "gray", marginBottom: 10 }}>
          Preparing device for notifications...
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, { opacity: isLoginDisabled ? 0.5 : 1 }]}
        onPress={handleLogin}
        disabled={isLoginDisabled}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Logging you in...</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
  },
  input: {
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
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  spinnerContainer: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
});
